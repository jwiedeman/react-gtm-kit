import { DEFAULT_DATA_LAYER_NAME } from '@jwiedeman/gtm-kit';
import type { ContainerConfigInput, ContainerDescriptor, ScriptAttributes } from '@jwiedeman/gtm-kit';

export const DEFAULT_GTM_HOST = 'https://www.googletagmanager.com';

const isString = (value: unknown): value is string => typeof value === 'string';

export const normalizeContainer = (input: ContainerConfigInput): ContainerDescriptor => {
  if (isString(input)) {
    return { id: input };
  }
  return input;
};

export const normalizeContainers = (
  containers: ContainerConfigInput | ContainerConfigInput[]
): ContainerDescriptor[] => {
  if (Array.isArray(containers)) {
    return containers.map(normalizeContainer);
  }
  return [normalizeContainer(containers)];
};

const toRecord = (params?: Record<string, string | number | boolean>): Record<string, string> => {
  if (!params) {
    return {};
  }
  return Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
};

const normalizeHost = (host: string): string => (host.endsWith('/') ? host.slice(0, -1) : host);

const buildUrl = (
  kind: 'gtm' | 'ns',
  host: string,
  containerId: string,
  queryParams?: Record<string, string | number | boolean>,
  dataLayerName: string = DEFAULT_DATA_LAYER_NAME
): string => {
  const normalizedHost = normalizeHost(host);
  const searchParams = new URLSearchParams({ id: containerId });

  const params = toRecord(queryParams);
  if (dataLayerName !== DEFAULT_DATA_LAYER_NAME && params.l === undefined) {
    params.l = dataLayerName;
  }

  for (const [key, value] of Object.entries(params)) {
    if (key === 'id') {
      continue;
    }
    searchParams.set(key, value);
  }

  const suffix = kind === 'gtm' ? 'gtm.js' : 'ns.html';
  return `${normalizedHost}/${suffix}?${searchParams.toString()}`;
};

export const buildScriptUrl = (
  host: string,
  containerId: string,
  queryParams?: Record<string, string | number | boolean>,
  dataLayerName: string = DEFAULT_DATA_LAYER_NAME
): string => buildUrl('gtm', host, containerId, queryParams, dataLayerName);

export const buildNoscriptUrl = (
  host: string,
  containerId: string,
  queryParams?: Record<string, string | number | boolean>,
  dataLayerName: string = DEFAULT_DATA_LAYER_NAME
): string => buildUrl('ns', host, containerId, queryParams, dataLayerName);

export interface GtmScriptConfig {
  containers: ContainerConfigInput | ContainerConfigInput[];
  host?: string;
  defaultQueryParams?: Record<string, string | number | boolean>;
  scriptAttributes?: ScriptAttributes;
  dataLayerName?: string;
}

export interface ScriptTagData {
  id: string;
  src: string;
  async: boolean;
  defer?: boolean;
  nonce?: string;
  attributes: Record<string, string | boolean>;
}

/**
 * Generate script tag data for GTM containers.
 * Used by Astro components to render script tags.
 */
export const generateScriptTags = (config: GtmScriptConfig): ScriptTagData[] => {
  const {
    containers,
    host = DEFAULT_GTM_HOST,
    defaultQueryParams,
    scriptAttributes,
    dataLayerName = DEFAULT_DATA_LAYER_NAME
  } = config;

  const normalized = normalizeContainers(containers);

  if (!normalized.length) {
    throw new Error('At least one GTM container is required.');
  }

  return normalized.map((container) => {
    if (!container.id) {
      throw new Error('Container id is required.');
    }

    const params = {
      ...defaultQueryParams,
      ...container.queryParams
    };

    const src = buildScriptUrl(host, container.id, params, dataLayerName);
    const { async: asyncAttr, defer, nonce, ...restAttributes } = scriptAttributes ?? {};

    const attributes: Record<string, string | boolean> = {};

    for (const [key, value] of Object.entries(restAttributes)) {
      if (value !== undefined && value !== null) {
        attributes[key] = value;
      }
    }

    return {
      id: container.id,
      src,
      async: asyncAttr ?? true,
      defer,
      nonce,
      attributes
    };
  });
};

export interface NoscriptTagData {
  id: string;
  src: string;
  attributes: Record<string, string>;
}

const DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES: Record<string, string> = {
  height: '0',
  width: '0',
  style: 'display:none;visibility:hidden',
  title: 'Google Tag Manager'
};

/**
 * Generate noscript iframe data for GTM containers.
 * Used by Astro components to render noscript fallbacks.
 */
export const generateNoscriptTags = (
  config: Omit<GtmScriptConfig, 'scriptAttributes'> & {
    iframeAttributes?: Record<string, string | number | boolean>;
  }
): NoscriptTagData[] => {
  const {
    containers,
    host = DEFAULT_GTM_HOST,
    defaultQueryParams,
    iframeAttributes,
    dataLayerName = DEFAULT_DATA_LAYER_NAME
  } = config;

  const normalized = normalizeContainers(containers);

  if (!normalized.length) {
    throw new Error('At least one GTM container is required.');
  }

  return normalized.map((container) => {
    if (!container.id) {
      throw new Error('Container id is required.');
    }

    const params = {
      ...defaultQueryParams,
      ...container.queryParams
    };

    const src = buildNoscriptUrl(host, container.id, params, dataLayerName);
    const mergedAttributes = {
      ...DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES,
      ...iframeAttributes
    };

    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(mergedAttributes)) {
      if (value !== undefined && value !== null) {
        attributes[key] = String(value);
      }
    }

    return {
      id: container.id,
      src,
      attributes
    };
  });
};

/**
 * Generate the dataLayer initialization script.
 */
export const generateDataLayerScript = (dataLayerName: string = DEFAULT_DATA_LAYER_NAME): string => {
  return `window.${dataLayerName}=window.${dataLayerName}||[];`;
};
