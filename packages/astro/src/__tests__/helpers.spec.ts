import {
  normalizeContainer,
  normalizeContainers,
  buildScriptUrl,
  buildNoscriptUrl,
  generateScriptTags,
  generateNoscriptTags,
  generateDataLayerScript,
  DEFAULT_GTM_HOST
} from '../components/helpers';

describe('Component Helpers', () => {
  describe('normalizeContainer', () => {
    it('should normalize string to container descriptor', () => {
      expect(normalizeContainer('GTM-ABC123')).toEqual({ id: 'GTM-ABC123' });
    });

    it('should pass through container descriptor', () => {
      const descriptor = { id: 'GTM-ABC123', queryParams: { env: 'prod' } };
      expect(normalizeContainer(descriptor)).toEqual(descriptor);
    });
  });

  describe('normalizeContainers', () => {
    it('should normalize single string', () => {
      expect(normalizeContainers('GTM-ABC123')).toEqual([{ id: 'GTM-ABC123' }]);
    });

    it('should normalize array of strings', () => {
      expect(normalizeContainers(['GTM-ABC123', 'GTM-DEF456'])).toEqual([{ id: 'GTM-ABC123' }, { id: 'GTM-DEF456' }]);
    });

    it('should normalize mixed array', () => {
      expect(normalizeContainers(['GTM-ABC123', { id: 'GTM-DEF456', queryParams: { env: 'prod' } }])).toEqual([
        { id: 'GTM-ABC123' },
        { id: 'GTM-DEF456', queryParams: { env: 'prod' } }
      ]);
    });
  });

  describe('buildScriptUrl', () => {
    it('should build basic URL', () => {
      const url = buildScriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123');
      expect(url).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-ABC123');
    });

    it('should include query params', () => {
      const url = buildScriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123', { gtm_auth: 'abc', gtm_preview: 'env-1' });
      expect(url).toContain('gtm_auth=abc');
      expect(url).toContain('gtm_preview=env-1');
    });

    it('should include custom dataLayer name', () => {
      const url = buildScriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123', undefined, 'customDataLayer');
      expect(url).toContain('l=customDataLayer');
    });

    it('should normalize trailing slash in host', () => {
      const url = buildScriptUrl('https://example.com/', 'GTM-ABC123');
      expect(url).toBe('https://example.com/gtm.js?id=GTM-ABC123');
    });
  });

  describe('buildNoscriptUrl', () => {
    it('should build noscript URL', () => {
      const url = buildNoscriptUrl(DEFAULT_GTM_HOST, 'GTM-ABC123');
      expect(url).toBe('https://www.googletagmanager.com/ns.html?id=GTM-ABC123');
    });
  });

  describe('generateScriptTags', () => {
    it('should generate script tag data for single container', () => {
      const tags = generateScriptTags({ containers: 'GTM-ABC123' });

      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({
        id: 'GTM-ABC123',
        src: 'https://www.googletagmanager.com/gtm.js?id=GTM-ABC123',
        async: true,
        defer: undefined,
        nonce: undefined,
        attributes: {}
      });
    });

    it('should generate script tags for multiple containers', () => {
      const tags = generateScriptTags({ containers: ['GTM-ABC123', 'GTM-DEF456'] });

      expect(tags).toHaveLength(2);
      expect(tags[0].id).toBe('GTM-ABC123');
      expect(tags[1].id).toBe('GTM-DEF456');
    });

    it('should include script attributes', () => {
      const tags = generateScriptTags({
        containers: 'GTM-ABC123',
        scriptAttributes: {
          nonce: 'abc123',
          defer: true,
          'data-custom': 'value'
        }
      });

      expect(tags[0].nonce).toBe('abc123');
      expect(tags[0].defer).toBe(true);
      expect(tags[0].attributes).toEqual({ 'data-custom': 'value' });
    });

    it('should throw for empty containers', () => {
      expect(() => generateScriptTags({ containers: [] })).toThrow('At least one GTM container is required');
    });

    it('should throw for missing container id', () => {
      expect(() => generateScriptTags({ containers: { id: '' } })).toThrow('Container id is required');
    });
  });

  describe('generateNoscriptTags', () => {
    it('should generate noscript tag data', () => {
      const tags = generateNoscriptTags({ containers: 'GTM-ABC123' });

      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({
        id: 'GTM-ABC123',
        src: 'https://www.googletagmanager.com/ns.html?id=GTM-ABC123',
        attributes: {
          height: '0',
          width: '0',
          style: 'display:none;visibility:hidden',
          title: 'Google Tag Manager'
        }
      });
    });

    it('should merge custom iframe attributes', () => {
      const tags = generateNoscriptTags({
        containers: 'GTM-ABC123',
        iframeAttributes: { title: 'Custom Title', 'data-test': 'value' }
      });

      expect(tags[0].attributes.title).toBe('Custom Title');
      expect(tags[0].attributes['data-test']).toBe('value');
    });
  });

  describe('generateDataLayerScript', () => {
    it('should generate default dataLayer init', () => {
      const script = generateDataLayerScript();
      expect(script).toBe('window.dataLayer=window.dataLayer||[];');
    });

    it('should use custom dataLayer name', () => {
      const script = generateDataLayerScript('customDataLayer');
      expect(script).toBe('window.customDataLayer=window.customDataLayer||[];');
    });
  });
});
