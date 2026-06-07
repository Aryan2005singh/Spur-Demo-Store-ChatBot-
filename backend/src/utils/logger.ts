/**
 * Lightweight structured logger.
 * Outputs JSON in production for log aggregation tools (Render logs, Datadog…).
 * Outputs readable coloured text in development.
 */

const isProd = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

function log(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== undefined && { data }),
  };

  if (isProd) {
    // Structured JSON — parseable by log aggregators
    const output = JSON.stringify(entry);
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
    return;
  }

  // Human-readable dev output
  const colours: Record<LogLevel, string> = {
    info: '\x1b[36m',   // cyan
    warn: '\x1b[33m',   // yellow
    error: '\x1b[31m',  // red
    debug: '\x1b[35m',  // magenta
  };
  const reset = '\x1b[0m';
  const colour = colours[level];
  const prefix = `${colour}[${level.toUpperCase()}]${reset} ${entry.timestamp}`;
  const dataStr = data !== undefined ? `\n${JSON.stringify(data, null, 2)}` : '';

  if (level === 'error') {
    console.error(`${prefix} ${message}${dataStr}`);
  } else if (level === 'warn') {
    console.warn(`${prefix} ${message}${dataStr}`);
  } else {
    console.log(`${prefix} ${message}${dataStr}`);
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log('info', message, data),
  warn: (message: string, data?: unknown) => log('warn', message, data),
  error: (message: string, data?: unknown) => log('error', message, data),
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      log('debug', message, data);
    }
  },
};
