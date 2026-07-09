import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import type { MySqlConfig } from "./config.js";
import {
  validateAllowedSchemas,
  validateReadOnlySql,
  withMaxRowsLimit
} from "./sql-safety.js";

export type MySqlDatabase = ReturnType<typeof createMySqlDatabase>;

const quoteIdentifier = (identifier: string) =>
  `\`${identifier.replace(/`/g, "``")}\``;

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
