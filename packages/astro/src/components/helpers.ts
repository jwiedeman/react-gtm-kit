import {
  DEFAULT_DATA_LAYER_NAME,
  DEFAULT_GTM_HOST,
  DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES,
  normalizeContainer,
  normalizeContainers,
  buildGtmScriptUrl,
  buildGtmNoscriptUrl
} from '@jwiedeman/gtm-kit';
import type { ContainerConfigInput, ScriptAttributes } from '@jwiedeman/gtm-kit';

// Re-export for convenience
export {
  DEFAULT_GTM_HOST,
  DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES,
  normalizeContainer,
  normalizeContainers,
  buildGtmScriptUrl as buildScriptUrl,
  buildGtmNoscriptUrl as buildNoscriptUrl
};

/** Filter out null/undefined values from an object */
const filterNullish = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null)) as T;

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

    const src = buildGtmScriptUrl(host, container.id, params, dataLayerName);
    const { async: asyncAttr, defer, nonce, ...restAttributes } = scriptAttributes ?? {};

    return {
      id: container.id,
      src,
      async: asyncAttr ?? true,
      defer,
      nonce,
      attributes: filterNullish(restAttributes) as Record<string, string | boolean>
    };
  });
};

export interface NoscriptTagData {
  id: string;
  src: string;
  attributes: Record<string, string>;
}

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

    const src = buildGtmNoscriptUrl(host, container.id, params, dataLayerName);
    const mergedAttributes = {
      ...DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES,
      ...iframeAttributes
    };

    // Filter nullish values and convert to strings
    const attributes = Object.fromEntries(
      Object.entries(mergedAttributes)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    ) as Record<string, string>;

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
