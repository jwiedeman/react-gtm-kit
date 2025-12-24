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
