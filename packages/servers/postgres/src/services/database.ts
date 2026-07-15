import pg from "pg";
import type { PostgresConfig } from "../config.js";
import {
  validateAllowedSchemas,
  validatePostgresWriteSql,
  validateReadOnlySql,
  withMaxRowsLimit
} from "../sql/safety.js";

const { Pool } = pg;

export type PostgresDatabase = ReturnType<typeof createPostgresDatabase>;

const quoteIdentifier = (identifier: string) =>
  `"${identifier.replace(/"/g, '""')}"`;

const assertWriteToolsEnabled = (config: PostgresConfig) => {
  if (!config.enableWriteTools) {
    throw new Error(
      "PostgreSQL write tools are disabled. Set POSTGRES_ENABLE_WRITE_TOOLS=true to enable run_write_query."
    );
  }
};

const assertDiagnosticToolsEnabled = (config: PostgresConfig) => {
  if (!config.enableDiagnosticTools) {
    throw new Error(
      "PostgreSQL diagnostic tools are disabled. Set POSTGRES_ENABLE_DIAGNOSTIC_TOOLS=true to enable list_active_queries and get_locks."
    );
  }
};

export const createPostgresDatabase = (config: PostgresConfig) => {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: config.poolMax
  });

  const query = async <T extends Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ) => {
    const result = await pool.query<T>(sql, params);
    return result.rows;
  };

  const validateQueryAccess = (sql: string) => {
    validateReadOnlySql(sql);
    validateAllowedSchemas(sql, config.allowedSchemas);
  };

  const setLocalQueryGuards = async (client: pg.PoolClient) => {
    const searchPath = config.allowedSchemas.map(quoteIdentifier).join(", ");
    await client.query(`set local statement_timeout = ${config.queryTimeoutMs}`);
    await client.query(`set local search_path = ${searchPath}`);
  };

  return {
    close: async () => {
      await pool.end();
    },
    listTables: async (schema: string) =>
      query(
        `
          select table_name, table_type
          from information_schema.tables
          where table_schema = $1
          order by table_name
        `,
        [schema]
      ),
    describeTable: async (schema: string, tableName: string) =>
      query(
        `
          select column_name, data_type, is_nullable, column_default
          from information_schema.columns
          where table_schema = $1 and table_name = $2
          order by ordinal_position
        `,
        [schema, tableName]
      ),
    getForeignKeys: async (schema: string, tableName: string) =>
      query(
        `
          select
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema as foreign_table_schema,
            ccu.table_name as foreign_table_name,
            ccu.column_name as foreign_column_name
          from information_schema.table_constraints tc
          join information_schema.key_column_usage kcu
            on tc.constraint_name = kcu.constraint_name
            and tc.constraint_schema = kcu.constraint_schema
          join information_schema.constraint_column_usage ccu
            on ccu.constraint_name = tc.constraint_name
            and ccu.constraint_schema = tc.constraint_schema
          where tc.constraint_type = 'FOREIGN KEY'
            and tc.table_schema = $1
            and tc.table_name = $2
          order by tc.constraint_name, kcu.column_name
        `,
        [schema, tableName]
      ),
    getTableStats: async (schema: string, tableName: string) =>
      query(
        `
          select
            pg_stat.n_live_tup as live_rows,
            pg_stat.n_dead_tup as dead_rows,
            pg_stat.last_vacuum,
            pg_stat.last_autovacuum,
            pg_stat.last_analyze,
            pg_stat.last_autoanalyze,
            pg_size_pretty(pg_total_relation_size((quote_ident($1) || '.' || quote_ident($2))::regclass)) as total_size,
            pg_size_pretty(pg_table_size((quote_ident($1) || '.' || quote_ident($2))::regclass)) as table_size,
            pg_size_pretty(pg_indexes_size((quote_ident($1) || '.' || quote_ident($2))::regclass)) as indexes_size
          from pg_stat_user_tables pg_stat
          where pg_stat.schemaname = $1 and pg_stat.relname = $2
        `,
        [schema, tableName]
      ),
    getServerCapabilities: async () => {
      const [serverRows, extensions] = await Promise.all([
        query(
          `
            select
              version() as server_version,
              current_setting('server_version_num') as server_version_num,
              current_database() as database_name,
              current_user as current_user,
              pg_encoding_to_char(encoding) as encoding
            from pg_database
            where datname = current_database()
          `
        ),
        query(
          `
            select extname as extension_name, extversion as extension_version
            from pg_extension
            order by extname
          `
        )
      ]);

      return { server: serverRows[0] ?? null, extensions };
    },
    getIndexes: async (schema: string, tableName: string) =>
      query(
        `
          select
            index_class.relname as index_name,
            index_info.indisprimary as is_primary,
            index_info.indisunique as is_unique,
            index_info.indisvalid as is_valid,
            index_info.indisready as is_ready,
            access_method.amname as index_method,
            pg_get_indexdef(index_info.indexrelid) as definition,
            pg_get_expr(index_info.indpred, index_info.indrelid, true) as predicate,
            coalesce(
              jsonb_agg(
                jsonb_build_object(
                  'position', key_part.position,
                  'definition', pg_get_indexdef(index_info.indexrelid, key_part.position, true),
                  'is_included', key_part.position > index_info.indnkeyatts
                )
                order by key_part.position
              ) filter (where key_part.position is not null),
              '[]'::jsonb
            ) as columns
          from pg_index as index_info
          join pg_class as table_class on table_class.oid = index_info.indrelid
          join pg_namespace as table_schema on table_schema.oid = table_class.relnamespace
          join pg_class as index_class on index_class.oid = index_info.indexrelid
          join pg_am as access_method on access_method.oid = index_class.relam
          left join lateral generate_series(1, index_info.indnatts) as key_part(position) on true
          where table_schema.nspname = $1 and table_class.relname = $2
          group by
            index_info.indexrelid,
            index_class.relname,
            index_info.indisprimary,
            index_info.indisunique,
            index_info.indisvalid,
            index_info.indisready,
            access_method.amname,
            index_info.indpred,
            index_info.indrelid,
            index_info.indnkeyatts
          order by index_class.relname
        `,
        [schema, tableName]
      ),
    getConstraints: async (schema: string, tableName: string) =>
      query(
        `
          select
            constraint_info.conname as constraint_name,
            case constraint_info.contype
              when 'p' then 'PRIMARY KEY'
              when 'u' then 'UNIQUE'
              when 'f' then 'FOREIGN KEY'
              when 'c' then 'CHECK'
            end as constraint_type,
            pg_get_constraintdef(constraint_info.oid, true) as definition,
            coalesce(
              array_agg(attribute.attname order by key_column.position)
                filter (where attribute.attname is not null),
              array[]::name[]
            ) as columns,
            foreign_schema.nspname as foreign_table_schema,
            foreign_table.relname as foreign_table_name
          from pg_constraint as constraint_info
          join pg_class as table_class on table_class.oid = constraint_info.conrelid
          join pg_namespace as table_schema on table_schema.oid = table_class.relnamespace
          left join lateral unnest(constraint_info.conkey) with ordinality
            as key_column(attribute_number, position) on true
          left join pg_attribute as attribute
            on attribute.attrelid = constraint_info.conrelid
            and attribute.attnum = key_column.attribute_number
          left join pg_class as foreign_table on foreign_table.oid = constraint_info.confrelid
          left join pg_namespace as foreign_schema on foreign_schema.oid = foreign_table.relnamespace
          where table_schema.nspname = $1
            and table_class.relname = $2
            and constraint_info.contype in ('p', 'u', 'f', 'c')
          group by
            constraint_info.oid,
            constraint_info.conname,
            constraint_info.contype,
            foreign_schema.nspname,
            foreign_table.relname
          order by constraint_info.conname
        `,
        [schema, tableName]
      ),
    getPartitions: async (schema: string, tableName: string) =>
      query(
        `
          with recursive partition_tree as (
            select
              inheritance.inhrelid as relation_id,
              inheritance.inhparent as parent_relation_id,
              inheritance.inhparent as root_relation_id,
              1 as depth
            from pg_inherits as inheritance
            join pg_class as root_table on root_table.oid = inheritance.inhparent
            join pg_namespace as root_schema on root_schema.oid = root_table.relnamespace
            where root_schema.nspname = $1 and root_table.relname = $2
            union all
            select
              child.inhrelid as relation_id,
              child.inhparent as parent_relation_id,
              partition_tree.root_relation_id,
              partition_tree.depth + 1 as depth
            from pg_inherits as child
            join partition_tree on partition_tree.relation_id = child.inhparent
          )
          select
            partition_tree.depth,
            partition_schema.nspname as partition_schema,
            partition_table.relname as partition_name,
            parent_schema.nspname as parent_schema,
            parent_table.relname as parent_name,
            pg_get_partkeydef(root_table.oid) as partition_key,
            pg_get_expr(partition_table.relpartbound, partition_table.oid, true) as partition_bound
          from partition_tree
          join pg_class as partition_table on partition_table.oid = partition_tree.relation_id
          join pg_namespace as partition_schema on partition_schema.oid = partition_table.relnamespace
          join pg_class as parent_table on parent_table.oid = partition_tree.parent_relation_id
          join pg_namespace as parent_schema on parent_schema.oid = parent_table.relnamespace
          join pg_class as root_table on root_table.oid = partition_tree.root_relation_id
          order by partition_tree.depth, partition_schema.nspname, partition_table.relname
        `,
        [schema, tableName]
      ),
    getTableSize: async (schema: string, tableName: string) =>
      query(
        `
          select
            table_class.reltuples::bigint as estimated_rows,
            pg_table_size(table_class.oid) as table_size_bytes,
            pg_indexes_size(table_class.oid) as indexes_size_bytes,
            pg_total_relation_size(table_class.oid) as total_size_bytes,
            pg_size_pretty(pg_table_size(table_class.oid)) as table_size,
            pg_size_pretty(pg_indexes_size(table_class.oid)) as indexes_size,
            pg_size_pretty(pg_total_relation_size(table_class.oid)) as total_size
          from pg_class as table_class
          join pg_namespace as table_schema on table_schema.oid = table_class.relnamespace
          where table_schema.nspname = $1
            and table_class.relname = $2
            and table_class.relkind in ('r', 'p', 'm', 'f')
        `,
        [schema, tableName]
      ),
    listDatabaseObjects: async (schema: string) =>
      query(
        `
          select object_name, object_type, parent_object_name
          from (
            select
              relation.relname as object_name,
              case relation.relkind
                when 'r' then 'TABLE'
                when 'p' then 'PARTITIONED TABLE'
                when 'v' then 'VIEW'
                when 'm' then 'MATERIALIZED VIEW'
                when 'S' then 'SEQUENCE'
                when 'f' then 'FOREIGN TABLE'
              end as object_type,
              null::text as parent_object_name
            from pg_class as relation
            join pg_namespace as object_schema on object_schema.oid = relation.relnamespace
            where object_schema.nspname = $1
              and relation.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
            union all
            select
              routine.proname || '(' || pg_get_function_identity_arguments(routine.oid) || ')' as object_name,
              case routine.prokind
                when 'p' then 'PROCEDURE'
                else 'FUNCTION'
              end as object_type,
              null::text as parent_object_name
            from pg_proc as routine
            join pg_namespace as object_schema on object_schema.oid = routine.pronamespace
            where object_schema.nspname = $2
            union all
            select
              trigger_info.tgname as object_name,
              'TRIGGER' as object_type,
              relation.relname as parent_object_name
            from pg_trigger as trigger_info
            join pg_class as relation on relation.oid = trigger_info.tgrelid
            join pg_namespace as object_schema on object_schema.oid = relation.relnamespace
            where object_schema.nspname = $3 and not trigger_info.tgisinternal
          ) as database_objects
          order by object_type, object_name
        `,
        [schema, schema, schema]
      ),
    getIndexUsage: async (schema: string, tableName?: string) =>
      query(
        `
          select
            statistics.relname as table_name,
            statistics.indexrelname as index_name,
            statistics.idx_scan,
            statistics.idx_tup_read,
            statistics.idx_tup_fetch,
            pg_relation_size(statistics.indexrelid) as index_size_bytes,
            pg_size_pretty(pg_relation_size(statistics.indexrelid)) as index_size
          from pg_stat_user_indexes as statistics
          where statistics.schemaname = $1
            and ($2::text is null or statistics.relname = $2)
          order by statistics.idx_scan asc, statistics.indexrelname
        `,
        [schema, tableName ?? null]
      ),
    listActiveQueries: async (limit: number) => {
      assertDiagnosticToolsEnabled(config);
      return query(
        `
          select
            pid,
            usename as user_name,
            application_name,
            state,
            wait_event_type,
            wait_event,
            query_start,
            state_change,
            now() - query_start as query_age,
            left(query, 1000) as query
          from pg_stat_activity
          where datname = current_database()
            and pid <> pg_backend_pid()
            and state <> 'idle'
          order by query_start nulls last, pid
          limit $1
        `,
        [limit]
      );
    },
    getLocks: async (schema: string, limit: number) => {
      assertDiagnosticToolsEnabled(config);
      return query(
        `
          select
            lock_info.locktype,
            lock_info.mode,
            lock_info.granted,
            object_schema.nspname as schema_name,
            relation.relname as relation_name,
            activity.pid,
            activity.usename as user_name,
            activity.state,
            activity.wait_event_type,
            activity.wait_event,
            pg_blocking_pids(activity.pid) as blocking_pids,
            left(activity.query, 1000) as query
          from pg_locks as lock_info
          join pg_class as relation on relation.oid = lock_info.relation
          join pg_namespace as object_schema on object_schema.oid = relation.relnamespace
          left join pg_stat_activity as activity on activity.pid = lock_info.pid
          where object_schema.nspname = $1
          order by lock_info.granted, relation.relname, lock_info.mode
          limit $2
        `,
        [schema, limit]
      );
    },
    runWriteQuery: async (sql: string) => {
      assertWriteToolsEnabled(config);
      validatePostgresWriteSql(sql);
      const result = await pool.query(sql);
      return {
        command: result.command,
        affectedRows: result.rowCount ?? 0,
        rows: result.rows
      };
    },
    runReadOnlyQuery: async (sql: string) => {
      validateQueryAccess(sql);
      const client = await pool.connect();
      try {
        await client.query("begin read only");
        await setLocalQueryGuards(client);
        const result = await client.query(withMaxRowsLimit(sql, config.maxRows));
        await client.query("commit");
        return result.rows;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
    explainQuery: async (sql: string) => {
      validateQueryAccess(sql);
      const client = await pool.connect();
      try {
        await client.query("begin read only");
        await setLocalQueryGuards(client);
        const result = await client.query(
          `explain (format json, analyze false) ${sql}`
        );
        await client.query("commit");
        return result.rows;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    }
  };
};
