import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GtmHeadScript } from '../head-script';
import { GtmNoScript } from '../noscript';

const normalizeMarkup = (markup: string): string => markup.replace(/\s+/g, ' ');

describe('Next.js server helpers', () => {
  describe('GtmHeadScript', () => {
    it('renders script tags for single containers with defaults', () => {
      const markup = renderToStaticMarkup(<GtmHeadScript containers="GTM-TEST" />);

      expect(markup).toContain('data-gtm-container-id="GTM-TEST"');
      expect(markup).toContain('src="https://www.googletagmanager.com/gtm.js?id=GTM-TEST"');
      expect(markup).toContain('async=""');
    });

    it('applies custom host, query params, and attributes', () => {
      const markup = normalizeMarkup(
        renderToStaticMarkup(
          <GtmHeadScript
            containers={['GTM-ONE', { id: 'GTM-TWO', queryParams: { gtm_auth: 'auth' } }]}
            host="https://tags.example.com"
            defaultQueryParams={{ env: 'staging' }}
            scriptAttributes={{ defer: true, nonce: 'nonce-123', 'data-custom': 'yes' }}
          />
        )
      );

      expect(markup).toContain('data-gtm-container-id="GTM-ONE"');
      expect(markup).toContain('src="https://tags.example.com/gtm.js?id=GTM-ONE&amp;env=staging"');
      expect(markup).toContain('data-gtm-container-id="GTM-TWO"');
      expect(markup).toContain('src="https://tags.example.com/gtm.js?id=GTM-TWO&amp;env=staging&amp;gtm_auth=auth"');
      expect(markup).toContain('data-custom="yes"');
      expect(markup).toContain('nonce="nonce-123"');
      expect(markup).toContain('defer=""');
    });
  });

  describe('GtmNoScript', () => {
    it('renders default noscript iframe markup', () => {
      const markup = renderToStaticMarkup(<GtmNoScript containers="GTM-ABC" />);

      expect(markup).toBe(
        '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-ABC" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>'
      );
    });

    it('honors host overrides and iframe attributes', () => {
      const markup = normalizeMarkup(
        renderToStaticMarkup(
          <GtmNoScript
            containers={[{ id: 'GTM-A', queryParams: { gtm_preview: 'env' } }, 'GTM-B']}
            host="https://tags.example.com"
            defaultQueryParams={{ env: 'prod' }}
            iframeAttributes={{ title: 'Custom Title', loading: 'lazy' }}
          />
        )
      );

      expect(markup).toContain('src="https://tags.example.com/ns.html?id=GTM-A&amp;env=prod&amp;gtm_preview=env"');
      expect(markup).toContain('src="https://tags.example.com/ns.html?id=GTM-B&amp;env=prod"');
      expect(markup).toContain('loading="lazy"');
      expect(markup).toContain('title="Custom Title"');
    });
  });
});
