import { describe, expect, it } from "vitest";
import {
  validateAllowedSchemas,
  validateReadOnlySql,
  withMaxRowsLimit
} from "./sql-safety.js";

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

  it("allows semicolons inside string literals", () => {
    expect(() =>
      validateReadOnlySql("select * from users where email like '%;%'")
    ).not.toThrow();
  });

  it("ignores dangerous keywords inside comments and strings", () => {
    expect(() =>
      validateReadOnlySql("select 'drop table users' as message -- delete")
    ).not.toThrow();
  });

  it("rejects non-read statements", () => {
    expect(() => validateReadOnlySql("show search_path")).toThrow(
      "Only SELECT, WITH, and EXPLAIN statements are allowed"
    );
  });
});

describe("withMaxRowsLimit", () => {
  it("wraps query with max rows limit", () => {
    expect(withMaxRowsLimit("select * from users", 500)).toBe(
      "select * from (\nselect * from users\n) as mcp_limited_query limit 500"
    );
  });

  it("keeps trailing line comments from swallowing the wrapper", () => {
    expect(withMaxRowsLimit("select * from users -- trailing comment", 500)).toBe(
      "select * from (\nselect * from users -- trailing comment\n) as mcp_limited_query limit 500"
    );
  });
});

describe("validateAllowedSchemas", () => {
  it("allows relations in configured schemas", () => {
    expect(() =>
      validateAllowedSchemas("select * from public.users u where u.id = 1", [
        "public"
      ])
    ).not.toThrow();
  });

  it("rejects schema-qualified relations outside configured schemas", () => {
    expect(() =>
      validateAllowedSchemas("select * from private.secrets", ["public"])
    ).toThrow('Schema "private" is not allowed');
  });

  it("does not treat aliases as schema names", () => {
    expect(() =>
      validateAllowedSchemas(
        "select u.name from public.users u where u.name is not null",
        ["public"]
      )
    ).not.toThrow();
  });

  it("rejects disallowed schemas in comma joins", () => {
    expect(() =>
      validateAllowedSchemas(
        "select * from public.users, private.secrets",
        ["public"]
      )
    ).toThrow('Schema "private" is not allowed');
  });

  it("rejects quoted disallowed schemas", () => {
    expect(() =>
      validateAllowedSchemas('select * from "private"."secrets"', ["public"])
    ).toThrow('Schema "private" is not allowed');
  });
});
