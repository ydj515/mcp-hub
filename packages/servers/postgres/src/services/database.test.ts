import { beforeEach, describe, expect, it, vi } from "vitest";

const { end, query } = vi.hoisted(() => ({
  end: vi.fn(),
  query: vi.fn()
}));

vi.mock("pg", () => ({
  default: {
    Pool: class {
      query = query;
      end = end;
    }
  }
}));

import { createPostgresDatabase } from "./database.js";

const config = {
  databaseUrl: "postgresql://localhost:5432/app",
  allowedSchemas: ["public"],
  maxRows: 500,
  queryTimeoutMs: 10000,
  poolMax: 1,
  enableWriteTools: false,
  enableDiagnosticTools: false
};

describe("createPostgresDatabase", () => {
  beforeEach(() => {
    end.mockReset();
    query.mockReset();
    end.mockResolvedValue(undefined);
    query.mockResolvedValue({ rows: [] });
  });

  it("rejects write queries when write tools are disabled", async () => {
    const db = createPostgresDatabase(config);

    await expect(
      db.runWriteQuery("delete from users where id = 1")
    ).rejects.toThrow("PostgreSQL write tools are disabled");
    await db.close();
  });

  it("queries PostgreSQL indexes with bound schema and table parameters", async () => {
    const db = createPostgresDatabase(config);

    await db.getIndexes("public", "users");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("pg_index"),
      ["public", "users"]
    );
    await db.close();
  });

  it("returns PostgreSQL server capabilities and installed extensions", async () => {
    const db = createPostgresDatabase(config);

    await db.getServerCapabilities();

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("server_version_num"),
      []
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("pg_extension"),
      []
    );
    await db.close();
  });

  it("queries PostgreSQL constraints with bound schema and table parameters", async () => {
    const db = createPostgresDatabase(config);

    await db.getConstraints("public", "users");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("pg_constraint"),
      ["public", "users"]
    );
    await db.close();
  });

  it("queries PostgreSQL partitions with bound schema and table parameters", async () => {
    const db = createPostgresDatabase(config);

    await db.getPartitions("public", "orders");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("with recursive partition_tree"),
      ["public", "orders"]
    );
    await db.close();
  });

  it("queries PostgreSQL index usage with bound optional table parameter", async () => {
    const db = createPostgresDatabase(config);

    await db.getIndexUsage("public");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("pg_stat_user_indexes"),
      ["public", null]
    );
    await db.close();
  });

  it("queries PostgreSQL relation locks with a bound schema and limit", async () => {
    const db = createPostgresDatabase({ ...config, enableDiagnosticTools: true });

    await db.getLocks("public", 50);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("pg_locks"),
      ["public", 50]
    );
    await db.close();
  });

  it("queries PostgreSQL table size with bound schema and table parameters", async () => {
    const db = createPostgresDatabase(config);

    await db.getTableSize("public", "users");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("pg_total_relation_size"),
      ["public", "users"]
    );
    await db.close();
  });

  it("lists PostgreSQL database objects for one bound schema", async () => {
    const db = createPostgresDatabase(config);

    await db.listDatabaseObjects("public");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("pg_proc"),
      ["public", "public", "public"]
    );
    await db.close();
  });

  it("lists active PostgreSQL queries with a bound limit", async () => {
    const db = createPostgresDatabase({ ...config, enableDiagnosticTools: true });

    await db.listActiveQueries(50);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("pg_stat_activity"),
      [50]
    );
    await db.close();
  });

  it("rejects PostgreSQL diagnostic queries until explicitly enabled", async () => {
    const db = createPostgresDatabase(config);

    await expect(db.listActiveQueries(50)).rejects.toThrow(
      "PostgreSQL diagnostic tools are disabled"
    );
    await expect(db.getLocks("public", 50)).rejects.toThrow(
      "PostgreSQL diagnostic tools are disabled"
    );
    expect(query).not.toHaveBeenCalled();
    await db.close();
  });
});
