import type { DataLayerState, DataLayerValue, Logger } from './types';

interface EnsureDataLayerResult extends DataLayerState {
  snapshot: DataLayerValue[] | undefined;
}

export interface MutationTraceOptions {
  logger: Logger;
  dataLayerName: string;
}

const isArray = (value: unknown): value is DataLayerValue[] => Array.isArray(value);

export const ensureDataLayer = (name: string): EnsureDataLayerResult => {
  const globalScope = globalThis as Record<string, unknown>;
  const existing = globalScope[name];
  const snapshot = isArray(existing) ? [...existing] : undefined;

  if (!isArray(existing)) {
    globalScope[name] = [] as DataLayerValue[];
  }

  return {
    name,
    dataLayer: globalScope[name] as DataLayerValue[],
    created: !isArray(existing),
    restore() {
      if (!isArray(existing)) {
        delete globalScope[name];
        return;
      }

      const clone = snapshot ? [...snapshot] : [];
      globalScope[name] = clone;
    },
    snapshot
  };
};

export const pushToDataLayer = (state: DataLayerState, value: DataLayerValue) => {
  state.dataLayer.push(value);
};

/**
 * Creates a Proxy wrapper around a dataLayer array that logs all mutations.
 * Used in debug mode to help developers trace dataLayer changes.
 */
export const createTracedDataLayer = (dataLayer: DataLayerValue[], options: MutationTraceOptions): DataLayerValue[] => {
  const { logger, dataLayerName } = options;

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'object') {
      try {
        const str = JSON.stringify(value);
        return str.length > 100 ? str.slice(0, 100) + '...' : str;
      } catch {
        return '[Object with circular reference]';
      }
    }
    return String(value);
  };

  return new Proxy(dataLayer, {
    set(target, property, value) {
      const index = Number(property);
      const isIndex = !Number.isNaN(index) && Number.isInteger(index) && index >= 0;

      if (isIndex) {
        const isReplacement = index < target.length;
        if (isReplacement) {
          logger.debug(`[${dataLayerName}] Replaced value at index ${index}`, {
            previousValue: formatValue(target[index]),
            newValue: formatValue(value)
          });
        } else {
          logger.debug(`[${dataLayerName}] Added value at index ${index}`, {
            value: formatValue(value)
          });
        }
      }

      Reflect.set(target, property, value);
      return true;
    },

    deleteProperty(target, property) {
      const index = Number(property);
      const isIndex = !Number.isNaN(index) && Number.isInteger(index) && index >= 0;

      if (isIndex && index < target.length) {
        logger.debug(`[${dataLayerName}] Deleted value at index ${index}`, {
          deletedValue: formatValue(target[index])
        });
      }

      Reflect.deleteProperty(target, property);
      return true;
    },

    get(target, property) {
      const value = target[property as keyof typeof target];

      // Wrap mutating array methods to log their operations
      if (typeof value === 'function') {
        if (property === 'push') {
          return function (...args: DataLayerValue[]) {
            logger.debug(`[${dataLayerName}] push() called with ${args.length} item(s)`, {
              items: args.map((arg) => formatValue(arg)),
              previousLength: target.length
            });
            return Array.prototype.push.apply(target, args);
          };
        }

        if (property === 'pop') {
          return function () {
            const poppedValue = target[target.length - 1];
            logger.debug(`[${dataLayerName}] pop() called`, {
              poppedValue: formatValue(poppedValue),
              previousLength: target.length
            });
            return Array.prototype.pop.call(target);
          };
        }

        if (property === 'shift') {
          return function () {
            const shiftedValue = target[0];
            logger.debug(`[${dataLayerName}] shift() called`, {
              shiftedValue: formatValue(shiftedValue),
              previousLength: target.length
            });
            return Array.prototype.shift.call(target);
          };
        }

        if (property === 'unshift') {
          return function (...args: DataLayerValue[]) {
            logger.debug(`[${dataLayerName}] unshift() called with ${args.length} item(s)`, {
              items: args.map((arg) => formatValue(arg)),
              previousLength: target.length
            });
            return Array.prototype.unshift.apply(target, args);
          };
        }

        if (property === 'splice') {
          return function (start: number, deleteCount?: number, ...items: DataLayerValue[]) {
            const deletedItems = target.slice(start, start + (deleteCount ?? target.length - start));
            logger.debug(`[${dataLayerName}] splice() called`, {
              start,
              deleteCount: deleteCount ?? 'rest',
              deletedItems: deletedItems.map((item) => formatValue(item)),
              insertedItems: items.map((item) => formatValue(item)),
              previousLength: target.length
            });
            return Array.prototype.splice.apply(target, [start, deleteCount ?? target.length - start, ...items]);
          };
        }
      }

      return value;
    }
  });
};
