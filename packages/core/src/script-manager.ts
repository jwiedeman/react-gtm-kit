import { createLogger } from './logger';
import type {
  ContainerDescriptor,
  CreateGtmClientOptions,
  ScriptAttributes,
  ScriptLoadState,
  ScriptLoadStatus
} from './types';

const DEFAULT_HOST = 'https://www.googletagmanager.com';
const CONTAINER_ATTR = 'data-gtm-container-id';
const INSTANCE_ATTR = 'data-gtm-kit-instance';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  settled: boolean;
}

const createDeferred = <T>(): Deferred<T> => {
  let resolved = false;
  let resolver: (value: T) => void;

  const promise = new Promise<T>((resolve) => {
    resolver = resolve;
  });

  return {
    get settled() {
      return resolved;
    },
    promise,
    resolve: (value: T) => {
      if (resolved) {
        return;
      }

      resolved = true;
      resolver(value);
    }
  } as Deferred<T>;
};

export interface NormalizedContainer extends ContainerDescriptor {
  queryParams?: Record<string, string | number | boolean>;
}

export interface ScriptManagerOptions {
  instanceId: string;
  host?: string;
  scriptAttributes?: ScriptAttributes;
  defaultQueryParams?: Record<string, string | number | boolean>;
  logger?: CreateGtmClientOptions['logger'];
}

export interface EnsureResult {
  inserted: HTMLScriptElement[];
}

const toRecord = (
  params?: Record<string, string | number | boolean>
): Record<string, string> => {
  if (!params) {
    return {};
  }

  return Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
};

const buildScriptUrl = (
  host: string,
  containerId: string,
  queryParams?: Record<string, string | number | boolean>
): string => {
  const normalizedHost = host.endsWith('/') ? host.slice(0, -1) : host;
  const searchParams = new URLSearchParams({ id: containerId });

  const params = toRecord(queryParams);
  for (const [key, value] of Object.entries(params)) {
    if (key === 'id') {
      continue;
    }
    searchParams.set(key, value);
  }

  return `${normalizedHost}/gtm.js?${searchParams.toString()}`;
};

const findExistingScript = (containerId: string): HTMLScriptElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const attrSelector = `script[${CONTAINER_ATTR}="${containerId}"]`;
  const existingWithAttr = document.querySelector(attrSelector);
  if (existingWithAttr) {
    return existingWithAttr as HTMLScriptElement;
  }

  const scripts = Array.from(document.getElementsByTagName('script'));
  return (
    scripts.find((script) => script.src.includes(`id=${encodeURIComponent(containerId)}`)) || null
  );
};

const formatErrorMessage = (event: Event): string => {
  if (event instanceof ErrorEvent) {
    if (event.error) {
      return String(event.error);
    }

    if (event.message) {
      return event.message;
    }
  }

  return 'Failed to load GTM script.';
};

export class ScriptManager {
  private readonly logger = createLogger(this.options.logger);
  private readonly host = this.options.host ?? DEFAULT_HOST;
  private readonly defaultQueryParams = this.options.defaultQueryParams;
  private readonly scriptAttributes = this.options.scriptAttributes;
  private readonly insertedScripts = new Set<HTMLScriptElement>();
  private readonly readyCallbacks = new Set<(state: ScriptLoadState[]) => void>();
  private readiness = createDeferred<ScriptLoadState[]>();
  private readonly loadStates = new Map<string, ScriptLoadState>();
  private readonly pendingContainers = new Set<string>();

  constructor(private readonly options: ScriptManagerOptions) {}

  whenReady(): Promise<ScriptLoadState[]> {
    return this.readiness.promise;
  }

  onReady(callback: (state: ScriptLoadState[]) => void): () => void {
    this.readyCallbacks.add(callback);

    if (this.readiness.settled) {
      callback(Array.from(this.loadStates.values()));
    }

    return () => {
      this.readyCallbacks.delete(callback);
    };
  }

  private notifyReady(): void {
    const snapshot = Array.from(this.loadStates.values());

    if (!this.readiness.settled) {
      this.readiness.resolve(snapshot);
    }

    for (const callback of this.readyCallbacks) {
      callback(snapshot);
    }
  }

  private maybeNotifyReady(): void {
    if (this.pendingContainers.size === 0) {
      this.notifyReady();
    }
  }

  private recordState(state: ScriptLoadState): void {
    this.loadStates.set(state.containerId, state);
  }

  private resetReadiness(): void {
    this.pendingContainers.clear();
    this.loadStates.clear();
    this.readiness = createDeferred<ScriptLoadState[]>();
  }

  ensure(containers: NormalizedContainer[]): EnsureResult {
    if (typeof document === 'undefined') {
      this.logger.warn('No document available – skipping script injection.');

      for (const container of containers) {
        if (!container.id) {
          continue;
        }

        this.recordState({
          containerId: container.id,
          status: 'skipped',
          error: 'Document unavailable for script injection.'
        });
      }

      this.maybeNotifyReady();
      return { inserted: [] };
    }

    const inserted: HTMLScriptElement[] = [];
    const targetParent = document.head || document.body;
    if (!targetParent) {
      this.logger.error('Unable to find document.head or document.body for script injection.');

      for (const container of containers) {
        if (!container.id) {
          continue;
        }

        this.recordState({
          containerId: container.id,
          status: 'skipped',
          error: 'Missing document.head and document.body for GTM script injection.'
        });
      }

      this.maybeNotifyReady();
      return { inserted: [] };
    }

    for (const container of containers) {
      if (!container.id) {
        this.logger.warn('Skipping container with missing id.', { container });
        continue;
      }

      const existing = findExistingScript(container.id);
      if (existing) {
        this.logger.debug('Container script already present, skipping injection.', {
          containerId: container.id
        });

        this.recordState({
          containerId: container.id,
          src: existing.src,
          status: 'loaded',
          fromCache: true
        });
        continue;
      }

      const params = {
        ...this.defaultQueryParams,
        ...container.queryParams
      };

      const script = document.createElement('script');
      const url = buildScriptUrl(this.host, container.id, params);
      script.src = url;
      script.setAttribute(CONTAINER_ATTR, container.id);
      script.setAttribute(INSTANCE_ATTR, this.options.instanceId);

      const attributes = this.scriptAttributes ?? {};
      if (attributes.async !== undefined) {
        script.async = attributes.async;
      } else {
        script.async = true;
      }
      if (attributes.defer !== undefined) {
        script.defer = attributes.defer;
      }

      for (const [key, value] of Object.entries(attributes)) {
        if (key === 'async' || key === 'defer') {
          continue;
        }

        if (value === undefined || value === null) {
          continue;
        }

        const stringValue = String(value);

        if (key === 'nonce') {
          script.nonce = stringValue;
        }

        script.setAttribute(key, stringValue);
      }

      this.pendingContainers.add(container.id);

      const settle = (status: ScriptLoadStatus, event?: Event): void => {
        if (!this.pendingContainers.has(container.id)) {
          return;
        }

        this.pendingContainers.delete(container.id);

        const state: ScriptLoadState = {
          containerId: container.id,
          src: url,
          status,
          fromCache: false
        };

        if (status === 'failed' && event) {
          state.error = formatErrorMessage(event);
          this.logger.error('Failed to load GTM container script.', {
            containerId: container.id,
            src: url,
            error: state.error
          });
        }

        this.recordState(state);
        this.maybeNotifyReady();
      };

      script.addEventListener('load', () => settle('loaded'));
      script.addEventListener('error', (event) => settle('failed', event));

      targetParent.appendChild(script);
      this.insertedScripts.add(script);
      inserted.push(script);
      this.logger.info('Injected GTM container script.', { containerId: container.id, src: url });
    }

    this.maybeNotifyReady();
    return { inserted };
  }

  teardown() {
    if (typeof document === 'undefined') {
      return;
    }

    for (const script of this.insertedScripts) {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    this.insertedScripts.clear();
    this.resetReadiness();
  }
}
