import { describe, expect, it } from "vitest";
import { validateReadOnlySql, withMaxRowsLimit } from "./sql-safety.js";

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
    expect(() =>
      validateReadOnlySql("select * from users; drop table users")
    ).toThrow("Unsafe SQL keyword detected: DROP");
  });

  it("rejects multiple statements", () => {
    expect(() => validateReadOnlySql("select 1; select 2")).toThrow(
      "Only one SQL statement is allowed"
    );
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
      "select * from (select * from users) as mcp_limited_query limit 500"
    );
  });
});
