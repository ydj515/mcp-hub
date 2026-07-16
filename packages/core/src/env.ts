// 모든 MCP 서버 config.ts가 공유하는 환경변수 파서 유틸입니다.
// 서버별로 흩어져 있던 boolean/정수/CSV 파싱 규칙을 한곳으로 모아
// 동작을 통일하고, write 같은 보안 토글을 fail-safe하게 다룹니다.

// boolean 플래그를 파싱합니다.
// - 미설정(undefined) 또는 공백 문자열이면 fallback을 반환합니다.
// - "true"/"false"만 허용하며 대소문자와 앞뒤 공백은 무시합니다.
// - 그 외 값("yes", "1", "on" 등)은 오해를 막기 위해 예외를 던집니다.
export const parseBooleanFlag = (
  value: string | undefined,
  name: string,
  fallback = false
): boolean => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "") {
    return fallback;
  }
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  throw new Error(`${name} must be true or false`);
};

// 양의 정수를 파싱합니다.
// - 미설정 또는 공백이면 fallback을 반환합니다.
// - 숫자 이외의 문자가 섞이면("500abc") 예외를 던집니다.
export const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
  name: string
): number => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`${name} must be a positive integer`);
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
};

// 상한이 있는 양의 정수를 파싱합니다.
export const parseBoundedInt = (
  value: string | undefined,
  fallback: number,
  name: string,
  max: number
): number => {
  const parsed = parsePositiveInt(value, fallback, name);
  if (parsed > max) {
    throw new Error(`${name} must be less than or equal to ${max}`);
  }
  return parsed;
};

// 콤마 구분 문자열을 배열로 파싱합니다(항목 trim, 빈 항목 제거).
// 최소 개수 검증과 에러 메시지는 서버별로 다르므로 호출측에서 처리합니다.
export const parseCsv = (value: string | undefined): string[] => {
  if (value === undefined) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

// feature 토글이 꺼져 있으면 예외를 던지는 공통 게이트입니다.
// write/diagnostic tool 실행 직전에 호출합니다.
export const assertFeatureEnabled = (
  enabled: boolean,
  message: string
): void => {
  if (!enabled) {
    throw new Error(message);
  }
};
