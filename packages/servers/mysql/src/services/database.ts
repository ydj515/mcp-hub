import mysql from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { MySqlConfig } from "../config.js";
import {
  validateAllowedSchemas,
  validateMySqlWriteSql,
  validateReadOnlySql,
  withMaxRowsLimit
} from "../sql/safety.js";

export type MySqlDatabase = ReturnType<typeof createMySqlDatabase>;

const assertWriteToolsEnabled = (config: MySqlConfig) => {
  if (!config.enableWriteTools) {
    throw new Error(
      "MySQL write tools are disabled. Set MYSQL_ENABLE_WRITE_TOOLS=true to enable run_write_query."
    );
  }
};

const assertDiagnosticToolsEnabled = (config: MySqlConfig) => {
  if (!config.enableDiagnosticTools) {
    throw new Error(
      "MySQL diagnostic tools are disabled. Set MYSQL_ENABLE_DIAGNOSTIC_TOOLS=true to enable list_active_queries and get_locks."
    );
  }
};

const isUnknownColumnError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "ER_BAD_FIELD_ERROR";

export const createMySqlDatabase = (config: MySqlConfig) => {
  const pool = mysql.createPool({
    uri: config.mysqlUrl,
    connectionLimit: config.poolLimit
  });

  const query = async <T extends RowDataPacket[]>(
    sql: string,
    params: unknown[] = []
  ) => {
    const [rows] = await pool.query<T>(sql, params);
    return rows;
  };

  const validateQueryAccess = (sql: string) => {
    validateReadOnlySql(sql);
    validateAllowedSchemas(sql, config.allowedSchemas);
  };

  const allowedSchemaPlaceholders = config.allowedSchemas
    .map(() => "?")
    .join(", ");

  const getIndexes = async (schema: string, tableName: string) => {
    try {
      return await query(
        `
          select
            index_name,
            index_name = 'PRIMARY' as is_primary,
            non_unique = 0 as is_unique,
            seq_in_index as position,
            column_name,
            expression,
            collation as sort_direction,
            cardinality,
            sub_part as prefix_length,
            index_type,
            is_visible
          from information_schema.statistics
          where table_schema = ? and table_name = ?
          order by index_name, seq_in_index
        `,
        [schema, tableName]
      );
    } catch (error) {
      if (!isUnknownColumnError(error)) {
        throw error;
      }

      return query(
        `
          select
            index_name,
            index_name = 'PRIMARY' as is_primary,
            non_unique = 0 as is_unique,
            seq_in_index as position,
            column_name,
            collation as sort_direction,
            cardinality,
            sub_part as prefix_length,
            index_type
          from information_schema.statistics
          where table_schema = ? and table_name = ?
          order by index_name, seq_in_index
        `,
        [schema, tableName]
      );
    }
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
          where table_schema = ?
          order by table_name
        `,
        [schema]
      ),
    describeTable: async (schema: string, tableName: string) =>
      query(
        `
          select column_name, data_type, is_nullable, column_default
          from information_schema.columns
          where table_schema = ? and table_name = ?
          order by ordinal_position
        `,
        [schema, tableName]
      ),
    getForeignKeys: async (schema: string, tableName: string) =>
      query(
        `
          select
            constraint_name,
            column_name,
            referenced_table_schema as foreign_table_schema,
            referenced_table_name as foreign_table_name,
            referenced_column_name as foreign_column_name
          from information_schema.key_column_usage
          where table_schema = ?
            and table_name = ?
            and referenced_table_schema is not null
          order by constraint_name, ordinal_position
        `,
        [schema, tableName]
      ),
    getServerCapabilities: async () => {
      const [serverRows, storageEngines] = await Promise.all([
        query(
          `
            select
              version() as server_version,
              @@version_comment as version_comment,
              @@default_storage_engine as default_storage_engine,
              @@sql_mode as sql_mode
          `
        ),
        query(
          `
            select engine, support, transactions, xa, savepoints
            from information_schema.engines
            order by engine
          `
        )
      ]);

      return { server: serverRows[0] ?? null, storageEngines };
    },
    getIndexes,
    getConstraints: async (schema: string, tableName: string) =>
      query(
        `
          select
            table_constraints.constraint_name,
            table_constraints.constraint_type,
            key_column_usage.ordinal_position,
            key_column_usage.column_name,
            key_column_usage.referenced_table_schema as foreign_table_schema,
            key_column_usage.referenced_table_name as foreign_table_name,
            key_column_usage.referenced_column_name as foreign_column_name,
            referential_constraints.update_rule,
            referential_constraints.delete_rule,
            check_constraints.check_clause
          from information_schema.table_constraints as table_constraints
          left join information_schema.key_column_usage as key_column_usage
            on key_column_usage.constraint_schema = table_constraints.constraint_schema
            and key_column_usage.constraint_name = table_constraints.constraint_name
            and key_column_usage.table_schema = table_constraints.table_schema
            and key_column_usage.table_name = table_constraints.table_name
          left join information_schema.referential_constraints as referential_constraints
            on referential_constraints.constraint_schema = table_constraints.constraint_schema
            and referential_constraints.constraint_name = table_constraints.constraint_name
            and referential_constraints.table_name = table_constraints.table_name
          left join information_schema.check_constraints as check_constraints
            on check_constraints.constraint_schema = table_constraints.constraint_schema
            and check_constraints.constraint_name = table_constraints.constraint_name
          where table_constraints.table_schema = ?
            and table_constraints.table_name = ?
          order by table_constraints.constraint_name, key_column_usage.ordinal_position
        `,
        [schema, tableName]
      ),
    getPartitions: async (schema: string, tableName: string) =>
      query(
        `
          select
            partition_name,
            subpartition_name,
            partition_method,
            subpartition_method,
            partition_expression,
            subpartition_expression,
            partition_description,
            partition_ordinal_position,
            subpartition_ordinal_position,
            table_rows as estimated_rows,
            data_length,
            index_length
          from information_schema.partitions
          where table_schema = ?
            and table_name = ?
            and partition_name is not null
          order by partition_ordinal_position, subpartition_ordinal_position
        `,
        [schema, tableName]
      ),
    getTableSize: async (schema: string, tableName: string) =>
      query(
        `
          select
            table_rows as estimated_rows,
            coalesce(data_length, 0) as data_size_bytes,
            coalesce(index_length, 0) as index_size_bytes,
            coalesce(data_length, 0) + coalesce(index_length, 0) as total_size_bytes,
            coalesce(data_free, 0) as free_space_bytes,
            round((coalesce(data_length, 0) + coalesce(index_length, 0)) / 1024 / 1024, 2) as total_size_mb
          from information_schema.tables
          where table_schema = ? and table_name = ?
        `,
        [schema, tableName]
      ),
    getTableStats: async (schema: string, tableName: string) =>
      query(
        `
          select
            engine,
            table_rows as estimated_rows,
            avg_row_length,
            coalesce(data_length, 0) as data_size_bytes,
            coalesce(index_length, 0) as index_size_bytes,
            coalesce(data_free, 0) as free_space_bytes,
            auto_increment,
            create_time,
            update_time,
            check_time,
            table_collation
          from information_schema.tables
          where table_schema = ? and table_name = ?
        `,
        [schema, tableName]
      ),
    listDatabaseObjects: async (schema: string) =>
      query(
        `
          select object_name, object_type, parent_object_name
          from (
            select
              table_name as object_name,
              table_type as object_type,
              cast(null as char(255)) as parent_object_name
            from information_schema.tables
            where table_schema = ?
            union all
            select
              trigger_name as object_name,
              'TRIGGER' as object_type,
              event_object_table as parent_object_name
            from information_schema.triggers
            where trigger_schema = ?
            union all
            select
              routine_name as object_name,
              routine_type as object_type,
              cast(null as char(255)) as parent_object_name
            from information_schema.routines
            where routine_schema = ?
            union all
            select
              event_name as object_name,
              'EVENT' as object_type,
              cast(null as char(255)) as parent_object_name
            from information_schema.events
            where event_schema = ?
          ) as database_objects
          order by object_type, object_name
        `,
        [schema, schema, schema, schema]
      ),
    listActiveQueries: async (limit: number) => {
      assertDiagnosticToolsEnabled(config);
      return query(
        `
          select
            id as connection_id,
            user,
            host,
            db as schema_name,
            command,
            time as duration_seconds,
            state,
            left(info, 1000) as query
          from information_schema.processlist
          where db in (${allowedSchemaPlaceholders})
            and id <> connection_id()
            and command <> 'Sleep'
          order by time desc, id
          limit ?
        `,
        [...config.allowedSchemas, limit]
      );
    },
    getLocks: async (schema: string, limit: number) => {
      assertDiagnosticToolsEnabled(config);
      return query(
        `
          select
            engine,
            engine_transaction_id,
            thread_id,
            event_id,
            object_schema as schema_name,
            object_name,
            partition_name,
            subpartition_name,
            index_name,
            lock_type,
            lock_mode,
            lock_status
          from performance_schema.data_locks
          where object_schema = ?
          order by lock_status, object_name, index_name
          limit ?
        `,
        [schema, limit]
      );
    },
    runWriteQuery: async (sql: string) => {
      assertWriteToolsEnabled(config);
      validateMySqlWriteSql(sql);
      const [result] = await pool.query<RowDataPacket[] | ResultSetHeader>(sql);

      if (Array.isArray(result)) {
        return { affectedRows: 0, rows: result };
      }

      return { affectedRows: result.affectedRows, rows: [] };
    },
    runReadOnlyQuery: async (sql: string) => {
      validateQueryAccess(sql);
      const connection = await pool.getConnection();
      try {
        await connection.query("start transaction read only");
        const [rows] = await connection.query<RowDataPacket[]>(
          withMaxRowsLimit(sql, config.maxRows, config.queryTimeoutMs)
        );
        await connection.query("commit");
        return rows;
      } catch (error) {
        await connection.query("rollback");
        throw error;
      } finally {
        connection.release();
      }
    },
    explainQuery: async (sql: string) => {
      validateQueryAccess(sql);
      const connection = await pool.getConnection();
      try {
        await connection.query("start transaction read only");
        const [rows] = await connection.query<RowDataPacket[]>(
          `explain format=json ${sql}`
        );
        await connection.query("commit");
        return rows;
      } catch (error) {
        await connection.query("rollback");
        throw error;
      } finally {
        connection.release();
      }
    }
  };
};
