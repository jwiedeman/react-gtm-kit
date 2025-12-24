import {
  isString,
  normalizeContainer,
  normalizeContainers,
  toRecord,
  normalizeHost,
  buildGtmScriptUrl,
  buildGtmNoscriptUrl,
  escapeAttributeValue
} from '../url-utils';

describe('url-utils', () => {
  describe('isString', () => {
    it('returns true for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
    });

    it('returns false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
    });
  });

  describe('normalizeContainer', () => {
    it('converts string to ContainerDescriptor', () => {
      expect(normalizeContainer('GTM-TEST')).toEqual({ id: 'GTM-TEST' });
    });

    it('passes through ContainerDescriptor', () => {
      const desc = { id: 'GTM-TEST', queryParams: { env: '1' } };
      expect(normalizeContainer(desc)).toEqual(desc);
    });
  });

  describe('normalizeContainers', () => {
    it('normalizes a single string', () => {
      expect(normalizeContainers('GTM-TEST')).toEqual([{ id: 'GTM-TEST' }]);
    });

    it('normalizes an array of strings', () => {
      expect(normalizeContainers(['GTM-A', 'GTM-B'])).toEqual([{ id: 'GTM-A' }, { id: 'GTM-B' }]);
    });

    it('normalizes mixed array', () => {
      expect(normalizeContainers(['GTM-A', { id: 'GTM-B', queryParams: { x: '1' } }])).toEqual([
        { id: 'GTM-A' },
        { id: 'GTM-B', queryParams: { x: '1' } }
      ]);
    });
  });

  describe('toRecord', () => {
    it('returns empty object for undefined', () => {
      expect(toRecord(undefined)).toEqual({});
    });

    it('converts values to strings', () => {
      expect(toRecord({ a: 1, b: true, c: 'test' })).toEqual({
        a: '1',
        b: 'true',
        c: 'test'
      });
    });
  });

  describe('normalizeHost', () => {
    it('removes trailing slash', () => {
      expect(normalizeHost('https://example.com/')).toBe('https://example.com');
    });

    it('leaves host without trailing slash unchanged', () => {
      expect(normalizeHost('https://example.com')).toBe('https://example.com');
    });
  });

  describe('buildGtmScriptUrl', () => {
    it('builds basic script URL', () => {
      const url = buildGtmScriptUrl('https://www.googletagmanager.com', 'GTM-TEST');
      expect(url).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST');
    });

    it('includes query params', () => {
      const url = buildGtmScriptUrl('https://www.googletagmanager.com', 'GTM-TEST', { gtm_auth: 'abc' });
      expect(url).toContain('gtm_auth=abc');
    });

    it('includes custom dataLayer name', () => {
      const url = buildGtmScriptUrl('https://www.googletagmanager.com', 'GTM-TEST', {}, 'myDataLayer');
      expect(url).toContain('l=myDataLayer');
    });

    it('does not include l param for default dataLayer name', () => {
      const url = buildGtmScriptUrl('https://www.googletagmanager.com', 'GTM-TEST', {}, 'dataLayer');
      expect(url).not.toContain('l=dataLayer');
    });

    it('normalizes trailing slash in host', () => {
      const url = buildGtmScriptUrl('https://www.googletagmanager.com/', 'GTM-TEST');
      expect(url).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST');
    });
  });

  describe('buildGtmNoscriptUrl', () => {
    it('builds basic noscript URL', () => {
      const url = buildGtmNoscriptUrl('https://www.googletagmanager.com', 'GTM-TEST');
      expect(url).toBe('https://www.googletagmanager.com/ns.html?id=GTM-TEST');
    });

    it('includes query params', () => {
      const url = buildGtmNoscriptUrl('https://www.googletagmanager.com', 'GTM-TEST', { gtm_preview: 'env-1' });
      expect(url).toContain('gtm_preview=env-1');
    });

    it('includes custom dataLayer name', () => {
      const url = buildGtmNoscriptUrl('https://www.googletagmanager.com', 'GTM-TEST', {}, 'myDataLayer');
      expect(url).toContain('l=myDataLayer');
    });
  });

  describe('escapeAttributeValue', () => {
    it('escapes ampersand', () => {
      expect(escapeAttributeValue('a&b')).toBe('a&amp;b');
    });

    it('escapes double quotes', () => {
      expect(escapeAttributeValue('a"b')).toBe('a&quot;b');
    });

    it('escapes less than', () => {
      expect(escapeAttributeValue('a<b')).toBe('a&lt;b');
    });

    it('escapes greater than', () => {
      expect(escapeAttributeValue('a>b')).toBe('a&gt;b');
    });

    it('escapes multiple characters', () => {
      expect(escapeAttributeValue('<script>"alert(1)"</script>')).toBe(
        '&lt;script&gt;&quot;alert(1)&quot;&lt;/script&gt;'
      );
    });
  });
});
