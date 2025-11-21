import { DEFAULT_DATA_LAYER_NAME } from '@react-gtm-kit/core';
import type { ContainerConfigInput, ContainerDescriptor } from '@react-gtm-kit/core';

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
