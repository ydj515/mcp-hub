export type Logger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export const createStderrLogger = (prefix = "mcp-hub"): Logger => ({
  info: (message) => console.error(`[${prefix}] ${message}`),
  warn: (message) => console.error(`[${prefix}] WARN ${message}`),
  error: (message) => console.error(`[${prefix}] ERROR ${message}`)
});
