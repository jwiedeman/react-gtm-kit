import type { Logger, PartialLogger } from './types';

type LogLevel = keyof Logger;

const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

const noop = () => {
  /* intentionally empty */
};

/**
 * Color codes for different log levels in console output.
 * Uses ANSI-like browser console styling.
 */
const levelColors: Record<LogLevel, string> = {
  debug: 'color: #6b7280', // gray
  info: 'color: #3b82f6', // blue
  warn: 'color: #f59e0b', // amber
  error: 'color: #ef4444' // red
};

const levelPrefixes: Record<LogLevel, string> = {
  debug: '[GTM-Kit DEBUG]',
  info: '[GTM-Kit INFO]',
  warn: '[GTM-Kit WARN]',
  error: '[GTM-Kit ERROR]'
};

/**
 * Creates a debug logger that outputs formatted messages to the console.
 * This is the built-in logger used when `debug: true` is set.
 */
export const createDebugLogger = (): Logger => {
  const createLogFn =
    (level: LogLevel) =>
    (message: string, details?: Record<string, unknown>): void => {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      const prefix = levelPrefixes[level];
      const style = levelColors[level];

      /* eslint-disable no-console -- Logger's purpose is to output to console */
      const consoleFn =
        level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : level === 'info'
              ? console.info
              : console.log;
      /* eslint-enable no-console */

      if (details && Object.keys(details).length > 0) {
        consoleFn(`%c${timestamp} ${prefix}%c ${message}`, style, 'color: inherit', details);
      } else {
        consoleFn(`%c${timestamp} ${prefix}%c ${message}`, style, 'color: inherit');
      }
    };

  return {
    debug: createLogFn('debug'),
    info: createLogFn('info'),
    warn: createLogFn('warn'),
    error: createLogFn('error')
  };
};

export const createLogger = (logger?: PartialLogger): Logger => {
  const safeLogger: Partial<Record<LogLevel, (message: string, details?: Record<string, unknown>) => void>> = {};

  for (const level of levels) {
    const provided = logger?.[level];
    if (typeof provided === 'function') {
      safeLogger[level] = provided.bind(logger);
      continue;
    }
    safeLogger[level] = noop;
  }

  return safeLogger as Logger;
};

export type LoggerFacade = ReturnType<typeof createLogger>;
