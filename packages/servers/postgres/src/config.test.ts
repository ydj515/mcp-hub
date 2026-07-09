import { describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./config.js";

describe("loadPostgresConfig", () => {
  it("loads defaults", () => {
    const config = loadPostgresConfig({
      POSTGRESQL_URL: "postgresql://readonly:pw@localhost:5432/app"
    });

    expect(config).toEqual({
      databaseUrl: "postgresql://readonly:pw@localhost:5432/app",
      allowedSchemas: ["public"],
      maxRows: 500,
      queryTimeoutMs: 10000,
      poolMax: 5
    });
  });

  it("throws when POSTGRESQL_URL is missing", () => {
    expect(() => loadPostgresConfig({})).toThrow("POSTGRESQL_URL is required");
  });

  it("throws when ALLOWED_SCHEMAS is empty", () => {
    expect(() =>
      loadPostgresConfig({
        POSTGRESQL_URL: "postgresql://readonly:pw@localhost:5432/app",
        ALLOWED_SCHEMAS: ","
      })
    ).toThrow("ALLOWED_SCHEMAS must include at least one schema");
  });
});
