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

/**
 * Validate that a string is a valid JavaScript identifier.
 * This prevents XSS attacks through dataLayerName injection.
 */
export const isValidJsIdentifier = (value: string): boolean => {
  // Must be a valid JS identifier: starts with letter/$/_, followed by letters/digits/$/_
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value);
};

/**
 * Escape a string for safe use in JavaScript string literals.
 * Prevents XSS when interpolating user-provided values into inline scripts.
 */
export const escapeJsString = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
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
 * @throws {Error} If dataLayerName is not a valid JavaScript identifier
 */
export const generateDataLayerScript = (dataLayerName: string = DEFAULT_DATA_LAYER_NAME): string => {
  if (!isValidJsIdentifier(dataLayerName)) {
    throw new Error(
      `Invalid dataLayerName: "${dataLayerName}". Must be a valid JavaScript identifier (letters, digits, $, _ only, cannot start with a digit).`
    );
  }
  return `window.${dataLayerName}=window.${dataLayerName}||[];`;
};
