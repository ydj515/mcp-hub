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
      poolLimit: 5
    });
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
