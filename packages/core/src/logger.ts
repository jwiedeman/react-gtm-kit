import type { Logger, PartialLogger } from './types';

type LogLevel = keyof Logger;

const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

const noop = () => {
  /* intentionally empty */
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
