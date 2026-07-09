import pg from "pg";
import type { PostgresConfig } from "./config.js";
import {
  validateAllowedSchemas,
  validateReadOnlySql,
  withMaxRowsLimit
} from "./sql-safety.js";

const { Pool } = pg;

export type PostgresDatabase = ReturnType<typeof createPostgresDatabase>;

const quoteIdentifier = (identifier: string) =>
  `"${identifier.replace(/"/g, '""')}"`;

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
