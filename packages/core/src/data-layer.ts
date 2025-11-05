import type { DataLayerState, DataLayerValue } from './types';

interface EnsureDataLayerResult extends DataLayerState {
  snapshot: DataLayerValue[] | undefined;
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
