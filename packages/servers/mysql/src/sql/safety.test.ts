import { describe, expect, it } from "vitest";
import {
  validateAllowedSchemas,
  validateMySqlWriteSql,
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
      "Only SELECT and WITH statements are allowed"
    );
  });

  it("rejects EXPLAIN statements", () => {
    expect(() => validateReadOnlySql("explain select * from users")).toThrow(
      "Only SELECT and WITH statements are allowed"
    );
  });
});

describe("validateMySqlWriteSql", () => {
  it.each([
    "insert into users (name) values ('A')",
    "update users set name = 'B' where id = 1",
    "update users set role = 'admin' where id = 1",
    "delete from users where id = 1",
    "replace into users (id, name) values (1, 'A')",
    "create table archived_users (id int)",
    "create index idx_users_name on users (name)",
    "drop index idx_users_name on users",
    "alter table users add partition (partition p1 values less than (100))",
    "analyze table users",
    "optimize table users"
  ])("allows supported MySQL write statement: %s", (sql) => {
    expect(() => validateMySqlWriteSql(sql)).not.toThrow();
  });

  it.each([
    "drop table users",
    "truncate table users",
    "drop database app",
    "drop schema app",
    "grant all on app.* to dev",
    "select 1; delete from users"
  ])("rejects forbidden MySQL write statement: %s", (sql) => {
    expect(() => validateMySqlWriteSql(sql)).toThrow(
      "MySQL write statement is not allowed"
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
