import { describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./config.js";

describe("loadPostgresConfig", () => {
  it("loads defaults", () => {
    const config = loadPostgresConfig({
      DATABASE_URL: "postgresql://readonly:pw@localhost:5432/app"
    });

    expect(config).toEqual({
      databaseUrl: "postgresql://readonly:pw@localhost:5432/app",
      allowedSchemas: ["public"],
      maxRows: 500,
      queryTimeoutMs: 10000,
      poolMax: 5
    });
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => loadPostgresConfig({})).toThrow("DATABASE_URL is required");
  });

  it("throws when ALLOWED_SCHEMAS is empty", () => {
    expect(() =>
      loadPostgresConfig({
        DATABASE_URL: "postgresql://readonly:pw@localhost:5432/app",
        ALLOWED_SCHEMAS: ","
      })
    ).toThrow("ALLOWED_SCHEMAS must include at least one schema");
  });
});
