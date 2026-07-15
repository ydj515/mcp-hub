import { describe, expect, it } from "vitest";
import { loadMySqlConfig } from "./config.js";

describe("loadMySqlConfig", () => {
  it("loads defaults", () => {
    const config = loadMySqlConfig({
      MYSQL_URL: "mysql://readonly:pw@localhost:3306/app"
    });

    expect(config).toEqual({
      mysqlUrl: "mysql://readonly:pw@localhost:3306/app",
      allowedSchemas: ["app"],
      maxRows: 500,
      queryTimeoutMs: 10000,
      poolLimit: 5,
      enableWriteTools: false,
      enableDiagnosticTools: false
    });
  });

  it("enables write tools explicitly", () => {
    const config = loadMySqlConfig({
      MYSQL_URL: "mysql://writer:pw@localhost:3306/app",
      MYSQL_ENABLE_WRITE_TOOLS: "true"
    });

    expect(config.enableWriteTools).toBe(true);
  });

  it("enables diagnostic tools explicitly", () => {
    const config = loadMySqlConfig({
      MYSQL_URL: "mysql://readonly:pw@localhost:3306/app",
      MYSQL_ENABLE_DIAGNOSTIC_TOOLS: "true"
    });

    expect(config.enableDiagnosticTools).toBe(true);
  });

  it("throws when MYSQL_URL is missing", () => {
    expect(() => loadMySqlConfig({})).toThrow("MYSQL_URL is required");
  });

  it("throws when MYSQL_ALLOWED_SCHEMAS is empty", () => {
    expect(() =>
      loadMySqlConfig({
        MYSQL_URL: "mysql://readonly:pw@localhost:3306/app",
        MYSQL_ALLOWED_SCHEMAS: ","
      })
    ).toThrow("MYSQL_ALLOWED_SCHEMAS must include at least one schema");
  });
});
