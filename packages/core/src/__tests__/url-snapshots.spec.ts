/**
 * Snapshot tests for URL generation.
 * These tests ensure URL formats remain stable and regressions are caught.
 */

import { buildGtmScriptUrl, buildGtmNoscriptUrl, createNoscriptMarkup } from '../index';
import { DEFAULT_GTM_HOST } from '../constants';

describe('URL Generation Snapshots', () => {
  describe('buildGtmScriptUrl', () => {
    it('generates basic GTM script URL', () => {
      const url = buildGtmScriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123');
      expect(url).toMatchInlineSnapshot(`"https://www.googletagmanager.com/gtm.js?id=GTM-ABC123"`);
    });

    it('generates URL with custom host', () => {
      const url = buildGtmScriptUrl('https://custom.gtm.example.com', 'GTM-ABC123');
      expect(url).toMatchInlineSnapshot(`"https://custom.gtm.example.com/gtm.js?id=GTM-ABC123"`);
    });

    it('generates URL with query params', () => {
      const url = buildGtmScriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123', {
        gtm_auth: 'abc123',
        gtm_preview: 'env-1',
        gtm_cookies_win: 'x'
      });
      expect(url).toMatchInlineSnapshot(
        `"https://www.googletagmanager.com/gtm.js?id=GTM-ABC123&gtm_auth=abc123&gtm_preview=env-1&gtm_cookies_win=x"`
      );
    });

    it('generates URL with dataLayer param', () => {
      const url = buildGtmScriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123', {}, 'customDataLayer');
      expect(url).toMatchInlineSnapshot(`"https://www.googletagmanager.com/gtm.js?id=GTM-ABC123&l=customDataLayer"`);
    });

    it('URL-encodes special characters in query params', () => {
      const url = buildGtmScriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123', {
        custom: 'value with spaces & special=chars'
      });
      expect(url).toMatchInlineSnapshot(
        `"https://www.googletagmanager.com/gtm.js?id=GTM-ABC123&custom=value+with+spaces+%26+special%3Dchars"`
      );
    });

    it('handles host with trailing slash', () => {
      const url = buildGtmScriptUrl('https://www.googletagmanager.com/', 'GTM-ABC123');
      expect(url).toMatchInlineSnapshot(`"https://www.googletagmanager.com/gtm.js?id=GTM-ABC123"`);
    });

    it('generates consistent URL for lowercase container ID', () => {
      const url = buildGtmScriptUrl(DEFAULT_GTM_HOST, 'gtm-abc123');
      expect(url).toMatchInlineSnapshot(`"https://www.googletagmanager.com/gtm.js?id=gtm-abc123"`);
    });
  });

  describe('buildGtmNoscriptUrl', () => {
    it('generates basic noscript URL', () => {
      const url = buildGtmNoscriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123');
      expect(url).toMatchInlineSnapshot(`"https://www.googletagmanager.com/ns.html?id=GTM-ABC123"`);
    });

    it('generates noscript URL with custom host', () => {
      const url = buildGtmNoscriptUrl('https://custom.gtm.example.com', 'GTM-ABC123');
      expect(url).toMatchInlineSnapshot(`"https://custom.gtm.example.com/ns.html?id=GTM-ABC123"`);
    });

    it('generates noscript URL with query params', () => {
      const url = buildGtmNoscriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123', {
        gtm_auth: 'secret123',
        gtm_preview: 'env-staging'
      });
      expect(url).toMatchInlineSnapshot(
        `"https://www.googletagmanager.com/ns.html?id=GTM-ABC123&gtm_auth=secret123&gtm_preview=env-staging"`
      );
    });
  });

  describe('createNoscriptMarkup', () => {
    it('generates basic noscript markup', () => {
      const markup = createNoscriptMarkup('GTM-ABC123');
      expect(markup).toMatchInlineSnapshot(
        `"<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-ABC123" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>"`
      );
    });

    it('generates noscript markup with custom host', () => {
      const markup = createNoscriptMarkup('GTM-ABC123', {
        host: 'https://custom.gtm.example.com'
      });
      expect(markup).toMatchInlineSnapshot(
        `"<noscript><iframe src="https://custom.gtm.example.com/ns.html?id=GTM-ABC123" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>"`
      );
    });

    it('generates noscript markup with query params', () => {
      const markup = createNoscriptMarkup({
        id: 'GTM-ABC123',
        queryParams: { gtm_auth: 'auth123', gtm_preview: 'env-2' }
      });
      expect(markup).toMatchInlineSnapshot(
        `"<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-ABC123&amp;gtm_auth=auth123&amp;gtm_preview=env-2" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>"`
      );
    });

    it('generates noscript markup with custom iframe attributes', () => {
      const markup = createNoscriptMarkup('GTM-ABC123', {
        iframeAttributes: {
          title: 'Custom GTM Frame',
          'data-purpose': 'analytics'
        }
      });
      expect(markup).toMatchInlineSnapshot(
        `"<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-ABC123" height="0" width="0" style="display:none;visibility:hidden" title="Custom GTM Frame" data-purpose="analytics"></iframe></noscript>"`
      );
    });

    it('generates noscript markup for multiple containers', () => {
      const markup = createNoscriptMarkup(['GTM-AAA111', 'GTM-BBB222']);
      expect(markup).toMatchInlineSnapshot(
        `"<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-AAA111" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-BBB222" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>"`
      );
    });

    it('escapes HTML entities in iframe attributes', () => {
      const markup = createNoscriptMarkup('GTM-ABC123', {
        iframeAttributes: {
          title: 'Test <script>"alert"</script>',
          'data-value': 'a&b<c>d"e'
        }
      });
      expect(markup).toMatchInlineSnapshot(
        `"<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-ABC123" height="0" width="0" style="display:none;visibility:hidden" title="Test &lt;script&gt;&quot;alert&quot;&lt;/script&gt;" data-value="a&amp;b&lt;c&gt;d&quot;e"></iframe></noscript>"`
      );
    });
  });
});
