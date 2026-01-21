/**
 * Comprehensive security tests for XSS vectors and injection prevention.
 * Tests all input paths that could be vulnerable to XSS or injection attacks.
 *
 * Security Model:
 * - Container IDs: Validated format (GTM-XXXXXX), URL encoded in requests
 * - Host URLs: User configuration, not sanitized (developers control this)
 * - Query params: URL encoded automatically by URLSearchParams
 * - DataLayer names: User configuration, used as JS variable names
 * - Noscript markup: HTML attribute values are escaped, URLs are URL-encoded
 */

import {
  createGtmClient,
  createNoscriptMarkup,
  buildGtmScriptUrl,
  escapeAttributeValue,
  toContainerId,
  isValidContainerId
} from '../index';

describe('XSS Prevention - Container ID Validation', () => {
  it('validates container ID format with isValidContainerId', () => {
    // Valid formats
    expect(isValidContainerId('GTM-ABC123')).toBe(true);
    expect(isValidContainerId('GTM-ABCDEFG')).toBe(true);
    expect(isValidContainerId('GTM-123456')).toBe(true);

    // Invalid formats (potential XSS)
    expect(isValidContainerId('<script>')).toBe(false);
    expect(isValidContainerId('GTM-<script>')).toBe(false);
    expect(isValidContainerId('javascript:')).toBe(false);
    expect(isValidContainerId('GTM-"onclick=')).toBe(false);
  });

  it('throws on invalid container ID with toContainerId', () => {
    expect(() => toContainerId('<script>alert(1)</script>')).toThrow(/Invalid GTM container ID format/);
    expect(() => toContainerId('GTM-"><script>')).toThrow(/Invalid GTM container ID format/);
    expect(() => toContainerId('javascript:alert(1)')).toThrow(/Invalid GTM container ID format/);
  });

  it('accepts valid container IDs with toContainerId', () => {
    expect(toContainerId('GTM-ABC123')).toBe('GTM-ABC123');
    expect(toContainerId('GTM-WXYZ7890')).toBe('GTM-WXYZ7890');
  });
});

describe('XSS Prevention - Safe Container IDs', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).dataLayer;
    document.head.innerHTML = '';
  });

  // Only test valid-format container IDs that might be attacker-controlled
  const safePayloads = [
    "GTM-ABC';",
    'GTM-123456', // Normal valid ID
    'GTM-ABCDEF'
  ];

  safePayloads.forEach((containerId) => {
    it(`handles container ID: ${containerId}`, () => {
      const client = createGtmClient({ containers: containerId });
      client.init();

      // Should work without throwing
      expect(client.isInitialized()).toBe(true);

      client.teardown();
    });
  });
});

describe('XSS Prevention - URL Building', () => {
  it('URL encodes container IDs in URLs', () => {
    const url = buildGtmScriptUrl('https://www.googletagmanager.com', 'GTM-ABC123');

    expect(url).toContain('id=GTM-ABC123');
    expect(url).toMatch(/^https:\/\/www\.googletagmanager\.com/);
  });

  it('URL encodes query params with special characters', () => {
    const url = buildGtmScriptUrl('https://www.googletagmanager.com', 'GTM-TEST123', {
      param: '<script>alert(1)</script>'
    });

    // URLSearchParams automatically URL-encodes
    expect(url).not.toContain('<script>');
    expect(url).toContain('%3Cscript%3E'); // URL-encoded
  });
});

describe('XSS Prevention - Query Parameters', () => {
  const maliciousParams = [
    { key: 'normal', value: '<script>alert("XSS")</script>' },
    { key: 'inject"><script>', value: 'test' },
    { key: 'normal', value: '"><img src=x onerror=alert(1)>' },
    { key: "';alert('xss');'", value: 'test' },
    { key: 'test', value: "'; DROP TABLE users; --" }
  ];

  maliciousParams.forEach(({ key, value }) => {
    it(`escapes malicious query param: ${key}=${value.slice(0, 20)}...`, () => {
      const url = buildGtmScriptUrl('https://www.googletagmanager.com', 'GTM-TEST123', {
        [key]: value
      });

      // URL should be properly encoded
      expect(url).not.toContain('<script');
      expect(url).not.toContain('onerror=');

      // Should be URL encoded
      const urlObj = new URL(url);
      const paramValue = urlObj.searchParams.get(key);
      if (paramValue) {
        expect(paramValue).toBe(value); // URLSearchParams decodes, original value preserved
      }
    });
  });
});

describe('XSS Prevention - DataLayer Name Validation', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).dataLayer;
    document.head.innerHTML = '';
  });

  // Malicious names that should be REJECTED
  const maliciousNames = [
    "dataLayer'];alert('XSS');//",
    "dataLayer\"];alert('XSS');//",
    'dataLayer<script>alert(1)</script>',
    "dataLayer');eval('alert(1)');//",
    'dataLayer`${alert(1)}`',
    'data-layer', // contains hyphen
    '123invalid', // starts with number
    'data layer' // contains space
  ];

  maliciousNames.forEach((name) => {
    it(`rejects malicious dataLayer name: ${name.slice(0, 30)}...`, () => {
      expect(() => {
        createGtmClient({
          containers: 'GTM-DLTEST1',
          dataLayerName: name
        });
      }).toThrow(/Invalid dataLayer name/);
    });
  });

  // Valid names that should be ACCEPTED
  const validNames = [
    'dataLayer',
    'myCustomLayer',
    'gtm_data',
    '_privateLayer',
    '$specialLayer',
    'layer123',
    'DataLayer',
    'DATALAYER'
  ];

  validNames.forEach((name) => {
    it(`accepts valid dataLayer name: ${name}`, () => {
      const client = createGtmClient({
        containers: 'GTM-DLVALID',
        dataLayerName: name
      });
      expect(client).toBeDefined();
    });
  });

  // Reserved words should be REJECTED
  const reservedWords = ['class', 'function', 'return', 'var', 'let', 'const'];

  reservedWords.forEach((name) => {
    it(`rejects reserved word as dataLayer name: ${name}`, () => {
      expect(() => {
        createGtmClient({
          containers: 'GTM-RESERVED',
          dataLayerName: name
        });
      }).toThrow(/Invalid dataLayer name/);
    });
  });
});

describe('XSS Prevention - Noscript Markup', () => {
  it('URL-encodes dangerous characters in iframe src URL', () => {
    const markup = createNoscriptMarkup({
      id: 'GTM-TEST123',
      queryParams: { param: '"><script>alert(1)</script>' }
    });

    // Query params are URL-encoded, not HTML-escaped (this is correct for URLs)
    expect(markup).not.toContain('"><script>');
    expect(markup).toContain('%22%3E%3Cscript%3E'); // URL-encoded
  });

  it('escapes HTML entities in iframe attributes', () => {
    const markup = createNoscriptMarkup(
      { id: 'GTM-TEST123' },
      {
        iframeAttributes: {
          title: 'Test <script>"alert"</script>',
          'data-value': 'a&b<c>d"e'
        }
      }
    );

    // HTML entity escaping in attribute values
    expect(markup).toContain('&lt;script&gt;');
    expect(markup).toContain('&quot;alert&quot;');
    expect(markup).toContain('a&amp;b&lt;c&gt;d&quot;e');
  });

  it('generates valid noscript markup structure', () => {
    const markup = createNoscriptMarkup('GTM-ABCDEF');

    expect(markup).toMatch(/^<noscript><iframe/);
    expect(markup).toMatch(/<\/iframe><\/noscript>$/);
    expect(markup).toContain('src="https://www.googletagmanager.com/ns.html?id=GTM-ABCDEF"');
  });

  it('does not allow script breakout via container ID in noscript', () => {
    // Container IDs passed to noscript are URL-encoded in the iframe src
    const markup = createNoscriptMarkup({
      id: 'GTM-TEST"><script>',
      queryParams: {}
    });

    // The " and > should be URL-encoded, preventing attribute breakout
    expect(markup).toContain('id=GTM-TEST%22%3E%3Cscript%3E');
    expect(markup).not.toContain('"><script>');
  });
});

describe('XSS Prevention - escapeAttributeValue', () => {
  it('escapes ampersand', () => {
    expect(escapeAttributeValue('a&b&c')).toBe('a&amp;b&amp;c');
  });

  it('escapes double quotes', () => {
    expect(escapeAttributeValue('a"b"c')).toBe('a&quot;b&quot;c');
  });

  it('escapes less than', () => {
    expect(escapeAttributeValue('a<b<c')).toBe('a&lt;b&lt;c');
  });

  it('escapes greater than', () => {
    expect(escapeAttributeValue('a>b>c')).toBe('a&gt;b&gt;c');
  });

  it('handles combined dangerous characters', () => {
    const input = '<script>alert("XSS");</script>';
    const escaped = escapeAttributeValue(input);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;);&lt;/script&gt;');
  });

  it('handles URL with dangerous characters', () => {
    const input = 'https://example.com?a=1&b=2"test<script>';
    const escaped = escapeAttributeValue(input);
    expect(escaped).toBe('https://example.com?a=1&amp;b=2&quot;test&lt;script&gt;');
  });

  it('handles empty string', () => {
    expect(escapeAttributeValue('')).toBe('');
  });

  it('handles string with no dangerous characters', () => {
    expect(escapeAttributeValue('hello world 123')).toBe('hello world 123');
  });
});

describe('XSS Prevention - Push Events', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('allows HTML strings in event data (they are data, not rendered)', () => {
    const client = createGtmClient({ containers: 'GTM-PUSHTEST' });
    client.init();

    // HTML in event data should be stored as-is (it's just data, not rendered HTML)
    expect(() => {
      client.push({
        event: 'user_message',
        message: '<script>alert("xss")</script>'
      });
    }).not.toThrow();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const lastEvent = dataLayer[dataLayer.length - 1] as Record<string, unknown>;
    expect(lastEvent.message).toBe('<script>alert("xss")</script>');

    client.teardown();
  });
});

describe('Injection Prevention - Console Command Injection', () => {
  it('does not execute eval-like patterns in dataLayer values', () => {
    const client = createGtmClient({ containers: 'GTM-EVALTEST' });
    client.init();

    // Test that potentially dangerous strings are just stored as data
    expect(() => {
      client.push({
        event: 'test',
        code: 'eval("malicious code")',
        func: 'Function("return this")()'
      });
    }).not.toThrow();

    // Verify the data is stored as-is (not executed)
    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const lastEvent = dataLayer[dataLayer.length - 1] as Record<string, unknown>;
    expect(lastEvent.code).toBe('eval("malicious code")');
    expect(lastEvent.func).toBe('Function("return this")()');

    client.teardown();
  });
});

describe('Injection Prevention - Prototype Pollution via Events', () => {
  it('does not pollute Object prototype through push events', () => {
    const client = createGtmClient({ containers: 'GTM-PROTOTEST' });
    client.init();

    // Attempt prototype pollution via __proto__
    client.push({
      event: 'test',
      __proto__: { polluted: true }
    });

    // Verify no pollution
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    client.teardown();
  });

  it('safely handles constructor key in events', () => {
    const client = createGtmClient({ containers: 'GTM-CONSTTEST' });
    client.init();

    expect(() => {
      client.push({
        event: 'test',
        constructor: { prototype: { evil: true } }
      });
    }).not.toThrow();

    // Verify Object constructor wasn't modified
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'evil')).toBe(false);

    client.teardown();
  });
});

describe('CSP Nonce Security', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).dataLayer;
    document.head.innerHTML = '';
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('applies valid base64 nonce to script element', () => {
    const validNonce = 'dGhpcyBpcyBhIHZhbGlkIG5vbmNl'; // base64 encoded string
    const client = createGtmClient({
      containers: 'GTM-NONCE01',
      scriptAttributes: { nonce: validNonce }
    });
    client.init();

    const script = document.querySelector('script[src*="GTM-NONCE01"]') as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.nonce).toBe(validNonce);
    expect(script.getAttribute('nonce')).toBe(validNonce);

    client.teardown();
  });

  it('applies nonce with special characters (alphanumeric + /+=)', () => {
    const nonceWithSpecialChars = 'abc123+/=ABC==';
    const client = createGtmClient({
      containers: 'GTM-NONCE02',
      scriptAttributes: { nonce: nonceWithSpecialChars }
    });
    client.init();

    const script = document.querySelector('script[src*="GTM-NONCE02"]') as HTMLScriptElement;
    expect(script?.nonce).toBe(nonceWithSpecialChars);

    client.teardown();
  });

  it('nonce is NOT exposed in the script URL', () => {
    const secretNonce = 'secret-nonce-value-123';
    const client = createGtmClient({
      containers: 'GTM-NONCE03',
      scriptAttributes: { nonce: secretNonce }
    });
    client.init();

    const script = document.querySelector('script[src*="GTM-NONCE03"]') as HTMLScriptElement;
    expect(script?.src).not.toContain(secretNonce);
    expect(script?.src).not.toContain('nonce');

    client.teardown();
  });

  it('handles empty nonce gracefully', () => {
    const client = createGtmClient({
      containers: 'GTM-NONCE04',
      scriptAttributes: { nonce: '' }
    });
    client.init();

    const script = document.querySelector('script[src*="GTM-NONCE04"]') as HTMLScriptElement;
    expect(script).not.toBeNull();
    // Empty nonce should be set (browser ignores empty nonces for CSP)
    expect(script.getAttribute('nonce')).toBe('');

    client.teardown();
  });

  it('applies same nonce to all containers', () => {
    const sharedNonce = 'shared-nonce-for-all';
    const client = createGtmClient({
      containers: ['GTM-MULTI01', 'GTM-MULTI02'],
      scriptAttributes: { nonce: sharedNonce }
    });
    client.init();

    const scripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
    expect(scripts.length).toBeGreaterThanOrEqual(2);

    scripts.forEach((script) => {
      expect((script as HTMLScriptElement).nonce).toBe(sharedNonce);
    });

    client.teardown();
  });

  it('preserves nonce with unicode characters', () => {
    // While unusual, nonces could technically contain unicode if base64 encoded
    const unicodeNonce = 'test-nonce-café-123';
    const client = createGtmClient({
      containers: 'GTM-NONCE05',
      scriptAttributes: { nonce: unicodeNonce }
    });
    client.init();

    const script = document.querySelector('script[src*="GTM-NONCE05"]') as HTMLScriptElement;
    expect(script?.getAttribute('nonce')).toBe(unicodeNonce);

    client.teardown();
  });

  it('nonce does not appear in noscript markup', () => {
    const secretNonce = 'top-secret-nonce';

    // Noscript markup should never include nonce (it's for scripts only)
    const markup = createNoscriptMarkup({
      id: 'GTM-NOSCRIPT',
      queryParams: {}
    });

    expect(markup).not.toContain(secretNonce);
    expect(markup).not.toContain('nonce');
  });

  it('does not leak nonce through data-* attributes', () => {
    const secretNonce = 'do-not-leak-this';
    const client = createGtmClient({
      containers: 'GTM-NONCE06',
      scriptAttributes: {
        nonce: secretNonce,
        'data-nonce': 'should-be-separate',
        'data-info': 'test'
      }
    });
    client.init();

    const script = document.querySelector('script[src*="GTM-NONCE06"]') as HTMLScriptElement;

    // The nonce attribute should have the secret value
    expect(script?.nonce).toBe(secretNonce);

    // data-nonce is a separate attribute, should not have the secret nonce
    expect(script?.getAttribute('data-nonce')).toBe('should-be-separate');

    client.teardown();
  });

  it('handles nonce with potentially dangerous characters safely', () => {
    // These should be stored as-is since nonce is applied to script.nonce property
    const dangerousLookingNonces = [
      '<script>',
      '"><script>alert(1)</script>',
      "javascript:alert('xss')",
      '${alert(1)}'
    ];

    dangerousLookingNonces.forEach((dangerousNonce, index) => {
      document.head.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;

      const client = createGtmClient({
        containers: `GTM-DANGER${index.toString().padStart(2, '0')}`,
        scriptAttributes: { nonce: dangerousNonce }
      });
      client.init();

      const script = document.querySelector(
        `script[src*="GTM-DANGER${index.toString().padStart(2, '0')}"]`
      ) as HTMLScriptElement;

      // The nonce is set on the property, not interpolated into HTML
      // This is safe because we're not building HTML strings
      expect(script?.nonce).toBe(dangerousNonce);

      client.teardown();
    });
  });

  it('nonce is applied through DOM property, not innerHTML', () => {
    // Verify that script creation uses DOM methods, not innerHTML
    // This is implicitly tested by the fact that nonces work at all,
    // since innerHTML-created scripts don't execute with CSP
    const nonce = 'dom-property-test';
    const client = createGtmClient({
      containers: 'GTM-DOMTEST',
      scriptAttributes: { nonce }
    });
    client.init();

    const script = document.querySelector('script[src*="GTM-DOMTEST"]') as HTMLScriptElement;

    // Script should be present and have nonce
    expect(script).not.toBeNull();
    expect(script.nonce).toBe(nonce);

    // Verify it's a proper script element
    expect(script.tagName).toBe('SCRIPT');
    expect(script.src).toContain('GTM-DOMTEST');

    client.teardown();
  });
});
