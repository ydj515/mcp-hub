import { describe, expect, it } from "vitest";
import {
  assertFeatureEnabled,
  parseBooleanFlag,
  parseBoundedInt,
  parseCsv,
  parsePositiveInt
} from "./env.js";

describe("parseBooleanFlag", () => {
  it("returns fallback for undefined or blank", () => {
    expect(parseBooleanFlag(undefined, "FLAG")).toBe(false);
    expect(parseBooleanFlag("", "FLAG")).toBe(false);
    expect(parseBooleanFlag("   ", "FLAG")).toBe(false);
    expect(parseBooleanFlag(undefined, "FLAG", true)).toBe(true);
  });

  it("parses true/false case-insensitively with trimming", () => {
    expect(parseBooleanFlag("true", "FLAG")).toBe(true);
    expect(parseBooleanFlag(" TRUE ", "FLAG")).toBe(true);
    expect(parseBooleanFlag("False", "FLAG")).toBe(false);
  });

  it("throws for non-boolean values", () => {
    expect(() => parseBooleanFlag("yes", "FLAG")).toThrow(
      "FLAG must be true or false"
    );
    expect(() => parseBooleanFlag("1", "FLAG")).toThrow(
      "FLAG must be true or false"
    );
  });
});

describe("parsePositiveInt", () => {
  it("returns fallback for undefined or blank", () => {
    expect(parsePositiveInt(undefined, 5, "N")).toBe(5);
    expect(parsePositiveInt("", 5, "N")).toBe(5);
  });

  it("parses positive integers", () => {
    expect(parsePositiveInt("42", 5, "N")).toBe(42);
    expect(parsePositiveInt(" 7 ", 5, "N")).toBe(7);
  });

  it("throws for non-integer or non-positive values", () => {
    expect(() => parsePositiveInt("500abc", 5, "N")).toThrow(
      "N must be a positive integer"
    );
    expect(() => parsePositiveInt("0", 5, "N")).toThrow(
      "N must be a positive integer"
    );
    expect(() => parsePositiveInt("-3", 5, "N")).toThrow(
      "N must be a positive integer"
    );
  });
});

describe("parseBoundedInt", () => {
  it("enforces the upper bound", () => {
    expect(parseBoundedInt("50", 10, "N", 100)).toBe(50);
    expect(() => parseBoundedInt("101", 10, "N", 100)).toThrow(
      "N must be less than or equal to 100"
    );
  });
});

describe("parseCsv", () => {
  it("splits, trims, and drops empty items", () => {
    expect(parseCsv("a, b ,, c")).toEqual(["a", "b", "c"]);
    expect(parseCsv(undefined)).toEqual([]);
    expect(parseCsv(" , ")).toEqual([]);
  });
});

describe("assertFeatureEnabled", () => {
  it("throws only when disabled", () => {
    expect(() => assertFeatureEnabled(true, "nope")).not.toThrow();
    expect(() => assertFeatureEnabled(false, "disabled")).toThrow("disabled");
  });
});
