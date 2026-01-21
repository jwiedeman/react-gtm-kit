import type { ContainerConfigInput, ContainerDescriptor } from './types';
import { DEFAULT_GTM_HOST } from './constants';
import { normalizeContainer, buildGtmNoscriptUrl, escapeAttributeValue } from './url-utils';

const DEFAULT_IFRAME_ATTRIBUTES: Record<string, string> = {
  height: '0',
  width: '0',
  style: 'display:none;visibility:hidden',
  title: 'Google Tag Manager'
};

const buildAttributeString = (attributes: Record<string, string | number | boolean> | undefined): string => {
  if (!attributes) {
    return '';
  }

  const entries = Object.entries(attributes);
  if (!entries.length) {
    return '';
  }

  return entries.map(([key, value]) => `${key}="${escapeAttributeValue(String(value))}"`).join(' ');
};

export interface NoscriptOptions {
  host?: string;
  defaultQueryParams?: Record<string, string | number | boolean>;
  iframeAttributes?: Record<string, string | number | boolean>;
}

const buildNoscriptForContainer = (container: ContainerDescriptor, options: NoscriptOptions): string => {
  if (!container.id) {
    throw new Error(
      'Container ID is required to build noscript markup. ' + 'Example: createNoscriptMarkup("GTM-XXXXXX")'
    );
  }

  const host = options.host ?? DEFAULT_GTM_HOST;
  const params = {
    ...options.defaultQueryParams,
    ...container.queryParams
  };

  const src = buildGtmNoscriptUrl(host, container.id, params);
  const iframeAttributes = {
    ...DEFAULT_IFRAME_ATTRIBUTES,
    ...options.iframeAttributes
  };
  const attributeString = buildAttributeString(iframeAttributes);

  const attrs = attributeString ? ` ${attributeString}` : '';
  return `<noscript><iframe src="${escapeAttributeValue(src)}"${attrs}></iframe></noscript>`;
};

export const createNoscriptMarkup = (
  containers: ContainerConfigInput[] | ContainerConfigInput,
  options: NoscriptOptions = {}
): string => {
  const normalizedContainers = Array.isArray(containers)
    ? containers.map(normalizeContainer)
    : [normalizeContainer(containers)];

  if (!normalizedContainers.length) {
    throw new Error(
      'At least one container is required to build noscript markup. ' +
        'Example: createNoscriptMarkup("GTM-XXXXXX") or createNoscriptMarkup(["GTM-ABC123", "GTM-XYZ789"])'
    );
  }

  return normalizedContainers.map((container) => buildNoscriptForContainer(container, options)).join('');
};

export const DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES = { ...DEFAULT_IFRAME_ATTRIBUTES };
