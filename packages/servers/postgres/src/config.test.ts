import { describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./config.js";

describe("loadPostgresConfig", () => {
  it("loads defaults", () => {
    const config = loadPostgresConfig({
      POSTGRES_URL: "postgresql://readonly:pw@localhost:5432/app"
    });

    expect(config).toEqual({
      databaseUrl: "postgresql://readonly:pw@localhost:5432/app",
      allowedSchemas: ["public"],
      maxRows: 500,
      queryTimeoutMs: 10000,
      poolMax: 5,
      enableWriteTools: false,
      enableDiagnosticTools: false
    });
  });

  it("enables write tools explicitly", () => {
    const config = loadPostgresConfig({
      POSTGRES_URL: "postgresql://writer:pw@localhost:5432/app",
      POSTGRES_ENABLE_WRITE_TOOLS: "true"
    });

    expect(config.enableWriteTools).toBe(true);
  });

  it("enables diagnostic tools explicitly", () => {
    const config = loadPostgresConfig({
      POSTGRES_URL: "postgresql://readonly:pw@localhost:5432/app",
      POSTGRES_ENABLE_DIAGNOSTIC_TOOLS: "true"
    });

    expect(config.enableDiagnosticTools).toBe(true);
  });

  it("throws when POSTGRES_URL is missing", () => {
    expect(() => loadPostgresConfig({})).toThrow("POSTGRES_URL is required");
  });

  it("throws when POSTGRES_ALLOWED_SCHEMAS is empty", () => {
    expect(() =>
      loadPostgresConfig({
        POSTGRES_URL: "postgresql://readonly:pw@localhost:5432/app",
        POSTGRES_ALLOWED_SCHEMAS: ","
      })
    ).toThrow("POSTGRES_ALLOWED_SCHEMAS must include at least one schema");
  });
});
