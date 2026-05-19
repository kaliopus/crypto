type LogMeta = Record<string, unknown>;

function redact(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (value.length > 16 && /(token|secret|key|password)/i.test(value)) return '[redacted]';
  return value;
}

function sanitize(meta: LogMeta = {}) {
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [key, redact(value)]));
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.info(JSON.stringify({ level: 'info', message, ...sanitize(meta) }));
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(JSON.stringify({ level: 'warn', message, ...sanitize(meta) }));
  },
  error(message: string, meta?: LogMeta) {
    console.error(JSON.stringify({ level: 'error', message, ...sanitize(meta) }));
  }
};
