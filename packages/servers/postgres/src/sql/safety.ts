const DANGEROUS_PATTERN =
  /\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|GRANT|REVOKE|COPY|EXECUTE|DO|CALL|SET\s+ROLE|SET\s+SESSION)\b/i;
const WRITE_PREFIX =
  /^(insert|update|delete|merge|create\s+(table|index)|drop\s+index|alter\s+table|analyze|vacuum|reindex)\b/i;
const FORBIDDEN_WRITE_PATTERN =
  /\b(drop\s+(table|database|schema)|truncate|grant|revoke|create\s+(user|role)|alter\s+(user|role))\b/i;

type MaskedSql = {
  code: string;
  semicolonIndexes: number[];
};

type SqlToken = {
  type: "comma" | "dot" | "identifier" | "open_paren" | "other";
  value: string;
};

const dollarQuoteTagAt = (sql: string, index: number) => {
  const match = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
  return match?.[0];
};

const maskSqlCode = (sql: string): MaskedSql => {
  const chars = sql.split("");
  const semicolonIndexes: number[] = [];
  let index = 0;

  const maskRange = (start: number, end: number) => {
    for (let position = start; position < end; position += 1) {
      chars[position] = /\s/.test(chars[position]) ? chars[position] : " ";
    }
  };

  while (index < sql.length) {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === "'") {
      const start = index;
      index += 1;
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") {
          index += 2;
          continue;
        }
        if (sql[index] === "'") {
          index += 1;
          break;
        }
        index += 1;
      }
      maskRange(start, index);
      continue;
    }

    if (char === '"') {
      const start = index;
      index += 1;
      while (index < sql.length) {
        if (sql[index] === '"' && sql[index + 1] === '"') {
          index += 2;
          continue;
        }
        if (sql[index] === '"') {
          index += 1;
          break;
        }
        index += 1;
      }
      maskRange(start, index);
      continue;
    }

    if (char === "-" && next === "-") {
      const start = index;
      index += 2;
      while (index < sql.length && sql[index] !== "\n") {
        index += 1;
      }
      maskRange(start, index);
      continue;
    }

    if (char === "/" && next === "*") {
      const start = index;
      index += 2;
      while (index < sql.length) {
        if (sql[index] === "*" && sql[index + 1] === "/") {
          index += 2;
          break;
        }
        index += 1;
      }
      maskRange(start, index);
      continue;
    }

    const dollarTag = char === "$" ? dollarQuoteTagAt(sql, index) : undefined;
    if (dollarTag) {
      const start = index;
      index += dollarTag.length;
      const end = sql.indexOf(dollarTag, index);
      index = end >= 0 ? end + dollarTag.length : sql.length;
      maskRange(start, index);
      continue;
    }

    if (char === ";") {
      semicolonIndexes.push(index);
    }
    index += 1;
  }

  return {
    code: chars.join(""),
    semicolonIndexes
  };
};

const stripTrailingStatementSemicolon = (sql: string) => {
  const masked = maskSqlCode(sql);
  if (!masked.semicolonIndexes.length) {
    return sql.trim();
  }

  const [lastSemicolon] = masked.semicolonIndexes.slice(-1);
  if (masked.semicolonIndexes.length > 1) {
    throw new Error("Only one SQL statement is allowed");
  }

  if (masked.code.slice(lastSemicolon + 1).trim()) {
    throw new Error("Only one SQL statement is allowed");
  }

  return `${sql.slice(0, lastSemicolon)}${sql.slice(lastSemicolon + 1)}`.trim();
};

const readQuotedIdentifier = (sql: string, index: number) => {
  let value = "";
  let cursor = index + 1;

  while (cursor < sql.length) {
    if (sql[cursor] === '"' && sql[cursor + 1] === '"') {
      value += '"';
      cursor += 2;
      continue;
    }
    if (sql[cursor] === '"') {
      return { value, nextIndex: cursor + 1 };
    }
    value += sql[cursor];
    cursor += 1;
  }

  return { value, nextIndex: cursor };
};

const tokenizeSql = (sql: string): SqlToken[] => {
  const tokens: SqlToken[] = [];
  let index = 0;

  const skipQuotedStringOrComment = () => {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === "'") {
      index += 1;
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") {
          index += 2;
          continue;
        }
        if (sql[index] === "'") {
          index += 1;
          break;
        }
        index += 1;
      }
      return true;
    }

    if (char === "-" && next === "-") {
      index += 2;
      while (index < sql.length && sql[index] !== "\n") {
        index += 1;
      }
      return true;
    }

    if (char === "/" && next === "*") {
      index += 2;
      while (index < sql.length) {
        if (sql[index] === "*" && sql[index + 1] === "/") {
          index += 2;
          break;
        }
        index += 1;
      }
      return true;
    }

    const dollarTag = char === "$" ? dollarQuoteTagAt(sql, index) : undefined;
    if (dollarTag) {
      index += dollarTag.length;
      const end = sql.indexOf(dollarTag, index);
      index = end >= 0 ? end + dollarTag.length : sql.length;
      return true;
    }

    return false;
  };

  while (index < sql.length) {
    if (/\s/.test(sql[index])) {
      index += 1;
      continue;
    }

    if (skipQuotedStringOrComment()) {
      continue;
    }

    if (sql[index] === '"') {
      const identifier = readQuotedIdentifier(sql, index);
      tokens.push({ type: "identifier", value: identifier.value });
      index = identifier.nextIndex;
      continue;
    }

    if (/[A-Za-z_]/.test(sql[index])) {
      const start = index;
      index += 1;
      while (index < sql.length && /[A-Za-z0-9_$]/.test(sql[index])) {
        index += 1;
      }
      tokens.push({
        type: "identifier",
        value: sql.slice(start, index).toLowerCase()
      });
      continue;
    }

    if (sql[index] === ".") {
      tokens.push({ type: "dot", value: "." });
    } else if (sql[index] === ",") {
      tokens.push({ type: "comma", value: "," });
    } else if (sql[index] === "(") {
      tokens.push({ type: "open_paren", value: "(" });
    } else {
      tokens.push({ type: "other", value: sql[index] });
    }
    index += 1;
  }

  return tokens;
};

const RELATION_BOUNDARY_KEYWORDS = new Set([
  "where",
  "group",
  "order",
  "having",
  "limit",
  "offset",
  "union",
  "except",
  "intersect",
  "on",
  "using"
]);

const optionalRelationModifiers = new Set(["lateral", "only"]);

const isAllowedSchema = (schema: string, allowedSchemas: string[]) =>
  allowedSchemas.some(
    (allowedSchema) =>
      allowedSchema === schema || allowedSchema.toLowerCase() === schema
  );

export const validateAllowedSchemas = (
  sql: string,
  allowedSchemas: string[]
) => {
  const tokens = tokenizeSql(sql);
  let expectingRelation = false;
  let relationListActive = false;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (
      token.type === "identifier" &&
      RELATION_BOUNDARY_KEYWORDS.has(token.value)
    ) {
      relationListActive = false;
      expectingRelation = false;
      continue;
    }

    if (
      token.type === "identifier" &&
      (token.value === "from" || token.value === "join")
    ) {
      expectingRelation = true;
      relationListActive = true;
      continue;
    }

    if (token.type === "comma" && relationListActive) {
      expectingRelation = true;
      continue;
    }

    if (!expectingRelation) {
      continue;
    }

    if (
      token.type === "identifier" &&
      optionalRelationModifiers.has(token.value)
    ) {
      continue;
    }

    if (token.type === "open_paren") {
      expectingRelation = false;
      continue;
    }

    if (token.type !== "identifier") {
      continue;
    }

    const next = tokens[index + 1];
    const nextNext = tokens[index + 2];
    if (next?.type === "dot" && nextNext?.type === "identifier") {
      if (!isAllowedSchema(token.value, allowedSchemas)) {
        throw new Error(
          `Schema "${token.value}" is not allowed. Allowed schemas: ${allowedSchemas.join(", ")}`
        );
      }
      index += 2;
    }

    expectingRelation = false;
  }
};

export const validateReadOnlySql = (sql: string) => {
  const normalized = stripTrailingStatementSemicolon(sql);
  if (!normalized) {
    throw new Error("SQL must not be empty");
  }

  const masked = maskSqlCode(normalized);
  const dangerousMatch = masked.code.match(DANGEROUS_PATTERN);
  if (dangerousMatch) {
    throw new Error(
      `Unsafe SQL keyword detected: ${dangerousMatch[1].toUpperCase()}`
    );
  }

  if (masked.semicolonIndexes.length) {
    throw new Error("Only one SQL statement is allowed");
  }

  if (!/^(select|with)\b/i.test(masked.code.trim())) {
    throw new Error("Only SELECT and WITH statements are allowed");
  }
};

export const validatePostgresWriteSql = (sql: string) => {
  let normalized: string;
  try {
    normalized = stripTrailingStatementSemicolon(sql);
  } catch {
    throw new Error("PostgreSQL write statement is not allowed");
  }

  if (!normalized) {
    throw new Error("PostgreSQL write statement is not allowed");
  }

  const masked = maskSqlCode(normalized);
  if (
    !WRITE_PREFIX.test(masked.code.trim()) ||
    FORBIDDEN_WRITE_PATTERN.test(masked.code)
  ) {
    throw new Error("PostgreSQL write statement is not allowed");
  }
};

export const withMaxRowsLimit = (sql: string, maxRows: number) => {
  const normalized = stripTrailingStatementSemicolon(sql);
  return [
    "select * from (",
    normalized,
    `) as mcp_limited_query limit ${maxRows}`
  ].join("\n");
};
