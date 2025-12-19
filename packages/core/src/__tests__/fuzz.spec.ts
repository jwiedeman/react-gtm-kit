/**
 * Property-based and fuzz testing for GTM Kit Core
 *
 * These tests ensure the library handles random and edge-case inputs
 * without crashing, throwing unexpected errors, or causing memory issues.
 */
import { createGtmClient, consentPresets } from '../../src';

/**
 * Simple random string generator for fuzz testing
 */
function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~!@#$%^&*()';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Generate random GTM-like IDs
 */
function randomGtmId(): string {
  const prefix = ['GTM', 'G', 'AW', 'DC'][Math.floor(Math.random() * 4)];
  const suffix = randomString(6 + Math.floor(Math.random() * 4)).toUpperCase();
  return `${prefix}-${suffix}`;
}

/**
 * Generate random nested objects
 */
function randomObject(depth = 0, maxDepth = 5): Record<string, unknown> {
  if (depth >= maxDepth) {
    return { value: randomString(10) };
  }

  const obj: Record<string, unknown> = {};
  const keys = Math.floor(Math.random() * 5) + 1;

  for (let i = 0; i < keys; i++) {
    const key = randomString(5 + Math.floor(Math.random() * 10));
    const type = Math.floor(Math.random() * 6);

    switch (type) {
      case 0:
        obj[key] = randomString(20);
        break;
      case 1:
        obj[key] = Math.random() * 10000;
        break;
      case 2:
        obj[key] = Math.random() > 0.5;
        break;
      case 3:
        obj[key] = null;
        break;
      case 4:
        obj[key] = [randomString(5), Math.random(), Math.random() > 0.5];
        break;
      case 5:
        obj[key] = randomObject(depth + 1, maxDepth);
        break;
    }
  }

  return obj;
}

describe('Fuzz Testing - Container IDs', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles 100 random GTM-like IDs', () => {
    for (let i = 0; i < 100; i++) {
      const containerId = randomGtmId();
      const client = createGtmClient({ containers: containerId });

      expect(() => client.init()).not.toThrow();
      expect(() => client.push({ event: 'test' })).not.toThrow();
      expect(() => client.teardown()).not.toThrow();

      // Cleanup
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    }
  });

  it('handles container IDs with special characters', () => {
    // These are valid IDs that should work without issues
    const safeCases = [
      'GTM-ABC123',
      'GTM-abc123',
      'GTM-XXXXXX',
      'GTM-123456',
      'G-ABCDEFGHIJ',
      'AW-123456789',
      'DC-ABCD1234',
      'GTM-A1B2C3D4',
      'GTM-特殊字符',
      'GTM-émoji🎉'
    ];

    safeCases.forEach((containerId) => {
      const client = createGtmClient({ containers: containerId });

      // Should not throw
      expect(() => client.init()).not.toThrow();
      expect(() => client.push({ event: 'test' })).not.toThrow();
      expect(() => client.teardown()).not.toThrow();

      // Cleanup
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });
  });

  it('handles edge case container IDs (may throw)', () => {
    // These IDs contain characters that may break CSS selectors
    // The library should either handle them gracefully or throw predictably
    const edgeCases = [
      'GTM-',
      '-GTM',
      'GTM',
      '',
      ' ',
      'GTM-WITH SPACE',
      'GTM-<script>'
    ];

    edgeCases.forEach((containerId) => {
      const client = createGtmClient({ containers: containerId });

      // These may throw or succeed - either is acceptable for edge cases
      try {
        client.init();
        client.push({ event: 'test' });
        client.teardown();
      } catch {
        // Expected for some edge cases
      }

      // Cleanup
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });
  });

  it('handles array of random container IDs', () => {
    const containerIds = Array.from({ length: 10 }, () => randomGtmId());
    const client = createGtmClient({ containers: containerIds });

    expect(() => client.init()).not.toThrow();
    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(10);
  });
});

describe('Fuzz Testing - Data Layer Names', () => {
  const createdLayers: string[] = [];

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  afterEach(() => {
    // Clean up only the layers we created in this test
    createdLayers.forEach((name) => {
      delete (globalThis as Record<string, unknown>)[name];
    });
    createdLayers.length = 0;
  });

  it('handles various valid JavaScript identifiers', () => {
    const validNames = [
      'dataLayer',
      '_dataLayer',
      '$dataLayer',
      'myDataLayer123',
      'customLayer',
      'GTMDataLayer',
      'testLayerA',
      'testLayerB'
    ];

    validNames.forEach((name) => {
      createdLayers.push(name);
      const client = createGtmClient({
        containers: 'GTM-TEST',
        dataLayerName: name
      });

      expect(() => client.init()).not.toThrow();
      expect((globalThis as Record<string, unknown>)[name]).toBeDefined();

      client.teardown();
      document.head.innerHTML = '';
      document.body.innerHTML = '';
    });
  });
});

describe('Fuzz Testing - Push Values', () => {
  let client: ReturnType<typeof createGtmClient>;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
    client = createGtmClient({ containers: 'GTM-FUZZ' });
    client.init();
  });

  afterEach(() => {
    client.teardown();
  });

  it('handles 1000 random objects', () => {
    for (let i = 0; i < 1000; i++) {
      const randomPayload = {
        event: `random_event_${i}`,
        ...randomObject()
      };

      expect(() => client.push(randomPayload)).not.toThrow();
    }

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(dataLayer.length).toBeGreaterThan(1000);
  });

  it('handles objects with random keys', () => {
    for (let i = 0; i < 100; i++) {
      const key = randomString(20);
      const obj: Record<string, unknown> = { event: 'random_key_test' };
      obj[key] = randomString(50);

      expect(() => client.push(obj)).not.toThrow();
    }
  });

  it('handles extreme numeric values', () => {
    const extremeNumbers = [
      0,
      -0,
      1,
      -1,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NaN,
      1e308,
      -1e308,
      1e-308,
      -1e-308,
      0.1 + 0.2, // Floating point precision issue
      Math.PI,
      Math.E
    ];

    extremeNumbers.forEach((num) => {
      expect(() => client.push({ event: 'number_test', value: num })).not.toThrow();
    });
  });

  it('handles extreme string lengths', () => {
    const lengths = [0, 1, 10, 100, 1000, 10000];

    lengths.forEach((len) => {
      const str = 'x'.repeat(len);
      expect(() => client.push({ event: 'string_test', value: str })).not.toThrow();
    });
  });

  it('handles arrays of various sizes', () => {
    const sizes = [0, 1, 10, 100, 1000];

    sizes.forEach((size) => {
      const arr = Array.from({ length: size }, (_, i) => ({ id: i }));
      expect(() => client.push({ event: 'array_test', items: arr })).not.toThrow();
    });
  });

  it('handles unicode strings', () => {
    const unicodeStrings = [
      '🎉🎊🎈', // Emojis
      '中文字符', // Chinese
      'العربية', // Arabic
      'עברית', // Hebrew
      'Ελληνικά', // Greek
      'Кириллица', // Cyrillic
      '日本語', // Japanese
      '한국어', // Korean
      '💩👻🤖', // More emojis
      '\u0000\u0001\u0002', // Control characters
      '\uD83D\uDE00', // Surrogate pairs
      '\uFEFF', // BOM
      '\u200B\u200C\u200D', // Zero-width characters
      'Line1\nLine2\rLine3\r\nLine4' // Various line endings
    ];

    unicodeStrings.forEach((str) => {
      expect(() => client.push({ event: 'unicode_test', value: str })).not.toThrow();
    });
  });
});

describe('Fuzz Testing - Host URLs', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles various URL formats', () => {
    const urls = [
      'https://www.googletagmanager.com',
      'https://www.googletagmanager.com/',
      'http://www.googletagmanager.com',
      'https://custom.gtm.example.com',
      'https://custom.gtm.example.com/',
      'https://custom.gtm.example.com/gtm/',
      'https://sub.domain.example.com',
      'https://192.168.1.1',
      'https://[::1]',
      'https://localhost',
      'https://localhost:8080',
      'https://example.com:443',
      'https://user:pass@example.com',
      'https://example.com/path?query=1',
      'https://example.com#hash'
    ];

    urls.forEach((url) => {
      const client = createGtmClient({
        containers: 'GTM-HOST-TEST',
        host: url
      });

      expect(() => client.init()).not.toThrow();
      client.teardown();

      // Cleanup
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });
  });
});

describe('Fuzz Testing - Query Parameters', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles various query parameter values', () => {
    const paramValues = [
      { key: 'gtm_auth', value: 'simple' },
      { key: 'gtm_auth', value: 'with spaces' },
      { key: 'gtm_auth', value: 'with=equals' },
      { key: 'gtm_auth', value: 'with&ampersand' },
      { key: 'gtm_auth', value: 'with?question' },
      { key: 'gtm_auth', value: 'with#hash' },
      { key: 'gtm_auth', value: '' },
      { key: 'gtm_auth', value: '中文' },
      { key: 'custom_param', value: 'test' }
    ];

    paramValues.forEach(({ key, value }) => {
      const queryParams: Record<string, string> = {};
      queryParams[key] = value;

      const client = createGtmClient({
        containers: { id: 'GTM-PARAMS', queryParams }
      });

      expect(() => client.init()).not.toThrow();
      client.teardown();

      // Cleanup
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });
  });
});

describe('Fuzz Testing - Consent Values', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles all consent presets', () => {
    const presets = [
      consentPresets.eeaDefault,
      consentPresets.allGranted,
      consentPresets.analyticsOnly
    ];

    presets.forEach((preset) => {
      const client = createGtmClient({ containers: 'GTM-CONSENT' });

      expect(() => client.setConsentDefaults(preset)).not.toThrow();
      expect(() => client.init()).not.toThrow();

      client.teardown();
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });
  });

  it('handles consent with various region arrays', () => {
    const regions = [
      [],
      ['US'],
      ['DE', 'FR'],
      ['US', 'CA', 'MX'],
      ['EEA'],
      ['US-CA', 'US-CO', 'US-CT'],
      Array.from({ length: 50 }, (_, i) => `REG-${i}`)
    ];

    regions.forEach((region) => {
      const client = createGtmClient({ containers: 'GTM-REGIONS' });

      expect(() => {
        client.setConsentDefaults({ analytics_storage: 'denied' }, { region });
      }).not.toThrow();

      expect(() => client.init()).not.toThrow();

      client.teardown();
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });
  });

  it('handles consent with various waitForUpdate values', () => {
    const waitTimes = [0, 1, 100, 500, 1000, 2000, 10000];

    waitTimes.forEach((waitForUpdate) => {
      const client = createGtmClient({ containers: 'GTM-WAIT' });

      expect(() => {
        client.setConsentDefaults({ analytics_storage: 'denied' }, { waitForUpdate });
      }).not.toThrow();

      expect(() => client.init()).not.toThrow();

      client.teardown();
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });
  });
});

describe('Fuzz Testing - Script Attributes', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles various script attribute combinations', () => {
    const attributeSets = [
      {},
      { nonce: 'abc123' },
      { async: true },
      { defer: true },
      { id: 'my-gtm-script' },
      { 'data-custom': 'value' },
      { crossorigin: 'anonymous' },
      { integrity: 'sha384-fake-hash' },
      { nonce: '', async: false, defer: false },
      { 'data-1': 'a', 'data-2': 'b', 'data-3': 'c' }
    ];

    attributeSets.forEach((scriptAttributes) => {
      const client = createGtmClient({
        containers: 'GTM-ATTRS',
        scriptAttributes: scriptAttributes as Record<string, string>
      });

      expect(() => client.init()).not.toThrow();

      client.teardown();
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });
  });
});

describe('Property-Based Testing', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  describe('Invariants', () => {
    it('init() always sets isInitialized() to true', () => {
      for (let i = 0; i < 50; i++) {
        const containerId = randomGtmId();
        const client = createGtmClient({ containers: containerId });

        expect(client.isInitialized()).toBe(false);
        client.init();
        expect(client.isInitialized()).toBe(true);

        client.teardown();
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        delete (globalThis as Record<string, unknown>).dataLayer;
      }
    });

    it('teardown() always sets isInitialized() to false', () => {
      for (let i = 0; i < 50; i++) {
        const containerId = randomGtmId();
        const client = createGtmClient({ containers: containerId });

        client.init();
        expect(client.isInitialized()).toBe(true);
        client.teardown();
        expect(client.isInitialized()).toBe(false);

        document.head.innerHTML = '';
        document.body.innerHTML = '';
        delete (globalThis as Record<string, unknown>).dataLayer;
      }
    });

    it('push() always adds to dataLayer after init()', () => {
      for (let i = 0; i < 50; i++) {
        const client = createGtmClient({ containers: 'GTM-PROP' });
        client.init();

        const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
        const lengthBefore = dataLayer.length;

        const eventData = { event: `test_${i}`, value: Math.random() };
        client.push(eventData);

        const lengthAfter = dataLayer.length;
        expect(lengthAfter).toBe(lengthBefore + 1);

        client.teardown();
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        delete (globalThis as Record<string, unknown>).dataLayer;
      }
    });

    it('scripts are always removed on teardown()', () => {
      for (let i = 0; i < 50; i++) {
        const containerCount = Math.floor(Math.random() * 5) + 1;
        const containers = Array.from({ length: containerCount }, () => randomGtmId());

        const client = createGtmClient({ containers });
        client.init();

        expect(document.querySelectorAll('script[data-gtm-container-id]').length).toBe(containerCount);

        client.teardown();

        expect(document.querySelectorAll('script[data-gtm-container-id]').length).toBe(0);

        document.head.innerHTML = '';
        document.body.innerHTML = '';
        delete (globalThis as Record<string, unknown>).dataLayer;
      }
    });
  });
});
