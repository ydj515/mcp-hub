import { beforeEach, describe, expect, it, vi } from "vitest";

const { end, query } = vi.hoisted(() => ({
  end: vi.fn(),
  query: vi.fn()
}));

vi.mock("mysql2/promise", () => ({
  default: {
    createPool: () => ({ end, query })
  }
}));

import { createMySqlDatabase } from "./database.js";

const config = {
  mysqlUrl: "mysql://localhost:3306/app",
  allowedSchemas: ["app"],
  maxRows: 500,
  queryTimeoutMs: 10000,
  poolLimit: 1,
  enableWriteTools: false,
  enableDiagnosticTools: false
};

describe("createMySqlDatabase", () => {
  beforeEach(() => {
    end.mockReset();
    query.mockReset();
    end.mockResolvedValue(undefined);
    query.mockResolvedValue([[], undefined]);
  });

  it("rejects write queries when write tools are disabled", async () => {
    const db = createMySqlDatabase(config);

    await expect(
      db.runWriteQuery("delete from users where id = 1")
    ).rejects.toThrow("MySQL write tools are disabled");
    await db.close();
  });

  it("queries MySQL indexes with bound schema and table parameters", async () => {
    const db = createMySqlDatabase(config);

    await db.getIndexes("app", "users");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("information_schema.statistics"),
      ["app", "users"]
    );
    await db.close();
  });

  it("retries MySQL index metadata without version-specific columns", async () => {
    query
      .mockRejectedValueOnce({ code: "ER_BAD_FIELD_ERROR" })
      .mockResolvedValueOnce([[], undefined]);
    const db = createMySqlDatabase(config);

    await db.getIndexes("app", "users");

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.not.stringContaining("is_visible"),
      ["app", "users"]
    );
    await db.close();
  });

  it("returns MySQL server capabilities and storage engines", async () => {
    const db = createMySqlDatabase(config);

    await db.getServerCapabilities();

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("default_storage_engine"),
      []
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("information_schema.engines"),
      []
    );
    await db.close();
  });

  it("queries MySQL constraints with bound schema and table parameters", async () => {
    const db = createMySqlDatabase(config);

    await db.getConstraints("app", "users");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("information_schema.table_constraints"),
      ["app", "users"]
    );
    await db.close();
  });

  it("queries MySQL partitions with bound schema and table parameters", async () => {
    const db = createMySqlDatabase(config);

    await db.getPartitions("app", "orders");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("information_schema.partitions"),
      ["app", "orders"]
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("partition_name is not null"),
      ["app", "orders"]
    );
    await db.close();
  });

  it("queries MySQL locks with a bound schema and limit", async () => {
    const db = createMySqlDatabase({ ...config, enableDiagnosticTools: true });

    await db.getLocks("app", 50);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("performance_schema.data_locks"),
      ["app", 50]
    );
    await db.close();
  });

  it("queries MySQL table size and statistics with bound parameters", async () => {
    const db = createMySqlDatabase(config);

    await db.getTableSize("app", "users");
    await db.getTableStats("app", "users");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("total_size_bytes"),
      ["app", "users"]
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("avg_row_length"),
      ["app", "users"]
    );
    await db.close();
  });

  it("lists MySQL database objects for one bound schema", async () => {
    const db = createMySqlDatabase(config);

    await db.listDatabaseObjects("app");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("information_schema.triggers"),
      ["app", "app", "app", "app"]
    );
    await db.close();
  });

  it("lists active MySQL queries only in allowed schemas", async () => {
    const db = createMySqlDatabase({ ...config, enableDiagnosticTools: true });

    await db.listActiveQueries(50);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("information_schema.processlist"),
      ["app", 50]
    );
    await db.close();
  });

  it("rejects MySQL diagnostic queries until explicitly enabled", async () => {
    const db = createMySqlDatabase(config);

    await expect(db.listActiveQueries(50)).rejects.toThrow(
      "MySQL diagnostic tools are disabled"
    );
    await expect(db.getLocks("app", 50)).rejects.toThrow(
      "MySQL diagnostic tools are disabled"
    );
    expect(query).not.toHaveBeenCalled();
    await db.close();
  });
});
