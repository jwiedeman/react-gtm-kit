import type { ContainerConfigInput, ContainerDescriptor } from './types';

const DEFAULT_HOST = 'https://www.googletagmanager.com';
const DEFAULT_IFRAME_ATTRIBUTES: Record<string, string> = {
  height: '0',
  width: '0',
  style: 'display:none;visibility:hidden',
  title: 'Google Tag Manager'
};

const isString = (value: unknown): value is string => typeof value === 'string';

const normalizeContainer = (input: ContainerConfigInput): ContainerDescriptor => {
  if (isString(input)) {
    return { id: input };
  }

  return input;
};

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

const escapeAttributeValue = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildNoscriptUrl = (
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

  return `${normalizedHost}/ns.html?${searchParams.toString()}`;
};

const buildAttributeString = (
  attributes: Record<string, string | number | boolean> | undefined
): string => {
  if (!attributes) {
    return '';
  }

  const entries = Object.entries(attributes);
  if (!entries.length) {
    return '';
  }

  return entries
    .map(([key, value]) => `${key}="${escapeAttributeValue(String(value))}"`)
    .join(' ');
};

export interface NoscriptOptions {
  host?: string;
  defaultQueryParams?: Record<string, string | number | boolean>;
  iframeAttributes?: Record<string, string | number | boolean>;
}

const buildNoscriptForContainer = (
  container: ContainerDescriptor,
  options: NoscriptOptions
): string => {
  if (!container.id) {
    throw new Error('Container id is required to build noscript markup.');
  }

  const host = options.host ?? DEFAULT_HOST;
  const params = {
    ...options.defaultQueryParams,
    ...container.queryParams
  };

  const src = buildNoscriptUrl(host, container.id, params);
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
    throw new Error('At least one container is required to build noscript markup.');
  }

  return normalizedContainers
    .map((container) => buildNoscriptForContainer(container, options))
    .join('');
};

export const DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES = { ...DEFAULT_IFRAME_ATTRIBUTES };
