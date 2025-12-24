import { DEFAULT_DATA_LAYER_NAME, DEFAULT_GTM_HOST } from './constants';
import type { ContainerConfigInput, ContainerDescriptor } from './types';

/**
 * Type guard to check if a value is a string.
 */
export const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Normalize a container input to a ContainerDescriptor.
 */
export const normalizeContainer = (input: ContainerConfigInput): ContainerDescriptor => {
  if (isString(input)) {
    return { id: input };
  }
  return input;
};

/**
 * Normalize container inputs to an array of ContainerDescriptors.
 */
export const normalizeContainers = (
  containers: ContainerConfigInput | ContainerConfigInput[]
): ContainerDescriptor[] => {
  if (Array.isArray(containers)) {
    return containers.map(normalizeContainer);
  }
  return [normalizeContainer(containers)];
};

/**
 * Convert query params to a Record<string, string>.
 */
export const toRecord = (params?: Record<string, string | number | boolean>): Record<string, string> => {
  if (!params) {
    return {};
  }
  return Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
};

/**
 * Normalize a host URL by removing trailing slashes.
 */
export const normalizeHost = (host: string): string => (host.endsWith('/') ? host.slice(0, -1) : host);

type UrlKind = 'gtm' | 'ns';

const buildUrl = (
  kind: UrlKind,
  host: string,
  containerId: string,
  queryParams?: Record<string, string | number | boolean>,
  dataLayerName: string = DEFAULT_DATA_LAYER_NAME
): string => {
  const normalizedHost = normalizeHost(host);
  const searchParams = new URLSearchParams({ id: containerId });

  const params = toRecord(queryParams);

  // Add dataLayer name parameter if using custom name
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

/**
 * Build a GTM script URL.
 */
export const buildGtmScriptUrl = (
  host: string,
  containerId: string,
  queryParams?: Record<string, string | number | boolean>,
  dataLayerName: string = DEFAULT_DATA_LAYER_NAME
): string => buildUrl('gtm', host, containerId, queryParams, dataLayerName);

/**
 * Build a GTM noscript iframe URL.
 */
export const buildGtmNoscriptUrl = (
  host: string,
  containerId: string,
  queryParams?: Record<string, string | number | boolean>,
  dataLayerName: string = DEFAULT_DATA_LAYER_NAME
): string => buildUrl('ns', host, containerId, queryParams, dataLayerName);

/**
 * Escape a string for use in HTML attributes.
 */
export const escapeAttributeValue = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Re-export default host for convenience
export { DEFAULT_GTM_HOST };
