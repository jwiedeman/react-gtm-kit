import type React from 'react';
import type { ContainerConfigInput, ScriptAttributes } from '@react-gtm-kit/core';
import { buildScriptUrl, DEFAULT_GTM_HOST, normalizeContainers } from './internal/container-helpers';

export interface GtmHeadScriptProps {
  containers: ContainerConfigInput | ContainerConfigInput[];
  host?: string;
  defaultQueryParams?: Record<string, string | number | boolean>;
  scriptAttributes?: ScriptAttributes;
}

const DEFAULT_ASYNC = true;

export const GtmHeadScript = ({
  containers,
  host = DEFAULT_GTM_HOST,
  defaultQueryParams,
  scriptAttributes
}: GtmHeadScriptProps): React.ReactElement => {
  const normalized = normalizeContainers(containers);

  if (!normalized.length) {
    throw new Error('At least one GTM container is required to render script tags.');
  }

  return (
    <>
      {normalized.map((container) => {
        if (!container.id) {
          throw new Error('Container id is required to render GTM script tags.');
        }

        const params = {
          ...defaultQueryParams,
          ...container.queryParams
        };

        const src = buildScriptUrl(host, container.id, params);
        const { async: asyncAttr, defer, nonce, ...restAttributes } = scriptAttributes ?? {};

        const scriptProps: React.ScriptHTMLAttributes<HTMLScriptElement> = {
          src,
          async: asyncAttr ?? DEFAULT_ASYNC
        };

        if (defer !== undefined) {
          scriptProps.defer = defer;
        }

        if (nonce) {
          scriptProps.nonce = nonce;
        }

        for (const [attribute, value] of Object.entries(restAttributes)) {
          if (attribute === 'async' || attribute === 'defer' || attribute === 'nonce' || attribute === 'src') {
            continue;
          }

          if (value === undefined || value === null) {
            continue;
          }

          (scriptProps as Record<string, unknown>)[attribute] = value;
        }

        return <script key={container.id} data-gtm-container-id={container.id} {...scriptProps} />;
      })}
    </>
  );
};
