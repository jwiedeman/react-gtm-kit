import { createLogger } from './logger';
import type {
  ContainerDescriptor,
  CreateGtmClientOptions,
  ScriptAttributes
} from './types';

const DEFAULT_HOST = 'https://www.googletagmanager.com';
const CONTAINER_ATTR = 'data-gtm-container-id';
const INSTANCE_ATTR = 'data-gtm-kit-instance';

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

export class ScriptManager {
  private readonly logger = createLogger(this.options.logger);
  private readonly host = this.options.host ?? DEFAULT_HOST;
  private readonly defaultQueryParams = this.options.defaultQueryParams;
  private readonly scriptAttributes = this.options.scriptAttributes;
  private readonly insertedScripts = new Set<HTMLScriptElement>();

  constructor(private readonly options: ScriptManagerOptions) {}

  ensure(containers: NormalizedContainer[]): EnsureResult {
    if (typeof document === 'undefined') {
      this.logger.warn('No document available – skipping script injection.');
      return { inserted: [] };
    }

    const inserted: HTMLScriptElement[] = [];
    const targetParent = document.head || document.body;
    if (!targetParent) {
      this.logger.error('Unable to find document.head or document.body for script injection.');
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

      targetParent.appendChild(script);
      this.insertedScripts.add(script);
      inserted.push(script);
      this.logger.info('Injected GTM container script.', { containerId: container.id, src: url });
    }

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
  }
}
