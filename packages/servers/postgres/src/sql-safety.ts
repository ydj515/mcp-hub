const DANGEROUS_PATTERN =
  /\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|GRANT|REVOKE|COPY|EXECUTE|DO|CALL|SET\s+ROLE|SET\s+SESSION)\b/i;

const stripTrailingSemicolon = (sql: string) =>
  sql.trim().replace(/;$/, "").trim();

export const validateReadOnlySql = (sql: string) => {
  const normalized = stripTrailingSemicolon(sql);
  if (!normalized) {
    throw new Error("SQL must not be empty");
  }

  const dangerousMatch = normalized.match(DANGEROUS_PATTERN);
  if (dangerousMatch) {
    throw new Error(
      `Unsafe SQL keyword detected: ${dangerousMatch[1].toUpperCase()}`
    );
  }

  if (normalized.includes(";")) {
    throw new Error("Only one SQL statement is allowed");
  }

  if (!/^(select|with|explain)\b/i.test(normalized)) {
    throw new Error("Only SELECT, WITH, and EXPLAIN statements are allowed");
  }

  if (/^explain\b/i.test(normalized) && /\banalyze\b/i.test(normalized)) {
    throw new Error("EXPLAIN ANALYZE is not allowed");
  }
};

export const withMaxRowsLimit = (sql: string, maxRows: number) => {
  const normalized = stripTrailingSemicolon(sql);
  return `select * from (${normalized}) as mcp_limited_query limit ${maxRows}`;
};
