import { describe, expect, it } from "vitest";
import {
  validateAllowedSchemas,
  validateReadOnlySql,
  withMaxRowsLimit
} from "./safety.js";

describe("validateReadOnlySql", () => {
  it("allows SELECT statements", () => {
    expect(() => validateReadOnlySql("select * from users")).not.toThrow();
  });

  it("allows WITH statements without dangerous keywords", () => {
    expect(() =>
      validateReadOnlySql(
        "with active as (select * from users) select * from active"
      )
    ).not.toThrow();
  });

  it("allows semicolons inside strings", () => {
    expect(() =>
      validateReadOnlySql("select * from users where email like '%;%'")
    ).not.toThrow();
  });

  it("rejects dangerous keywords", () => {
    expect(() => validateReadOnlySql("drop table users")).toThrow(
      "Unsafe SQL keyword detected: DROP"
    );
  });

  it("rejects multiple statements", () => {
    expect(() => validateReadOnlySql("select 1; select 2")).toThrow(
      "Only one SQL statement is allowed"
    );
  });

  it("rejects non-read statements", () => {
    expect(() => validateReadOnlySql("show databases")).toThrow(
      "Only SELECT, WITH, and EXPLAIN statements are allowed"
    );
  });
});

describe("withMaxRowsLimit", () => {
  it("wraps query with max rows limit and execution timeout", () => {
    expect(withMaxRowsLimit("select * from users", 500, 10000)).toBe(
      [
        "select /*+ MAX_EXECUTION_TIME(10000) */ * from (",
        "select * from users",
        ") as mcp_limited_query limit 500"
      ].join("\n")
    );
  });

  it("keeps trailing line comments from swallowing the wrapper", () => {
    expect(
      withMaxRowsLimit("select * from users -- trailing comment", 500, 10000)
    ).toBe(
      [
        "select /*+ MAX_EXECUTION_TIME(10000) */ * from (",
        "select * from users -- trailing comment",
        ") as mcp_limited_query limit 500"
      ].join("\n")
    );
  });
});

describe("validateAllowedSchemas", () => {
  it("allows relations in configured schemas", () => {
    expect(() =>
      validateAllowedSchemas("select * from app.users u where u.id = 1", [
        "app"
      ])
    ).not.toThrow();
  });

  it("rejects schema-qualified relations outside configured schemas", () => {
    expect(() =>
      validateAllowedSchemas("select * from private.secrets", ["app"])
    ).toThrow('Schema "private" is not allowed');
  });

  it("rejects backtick-quoted disallowed schemas", () => {
    expect(() =>
      validateAllowedSchemas("select * from `private`.`secrets`", ["app"])
    ).toThrow('Schema "private" is not allowed');
  });

  it("does not treat aliases as schema names", () => {
    expect(() =>
      validateAllowedSchemas(
        "select u.name from app.users u where u.name is not null",
        ["app"]
      )
    ).not.toThrow();
  });
});
