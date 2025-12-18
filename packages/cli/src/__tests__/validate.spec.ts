/**
 * @jest-environment node
 */
import {
  validateGtmId,
  validateGtmIds,
  validateDataLayerName,
  validateConfig
} from '../validate';

describe('validateGtmId', () => {
  describe('valid IDs', () => {
    it('accepts standard GTM ID format', () => {
      expect(validateGtmId('GTM-ABC1234')).toEqual({ valid: true });
    });

    it('accepts 6 character IDs', () => {
      expect(validateGtmId('GTM-ABCD12')).toEqual({ valid: true });
    });

    it('accepts 7 character IDs', () => {
      expect(validateGtmId('GTM-ABCD123')).toEqual({ valid: true });
    });

    it('accepts 8 character IDs', () => {
      expect(validateGtmId('GTM-ABCD1234')).toEqual({ valid: true });
    });

    it('accepts all uppercase letters', () => {
      expect(validateGtmId('GTM-ABCDEFGH')).toEqual({ valid: true });
    });

    it('accepts all numbers', () => {
      expect(validateGtmId('GTM-12345678')).toEqual({ valid: true });
    });

    it('trims whitespace', () => {
      expect(validateGtmId('  GTM-ABC1234  ')).toEqual({ valid: true });
    });
  });

  describe('invalid IDs', () => {
    it('rejects empty string', () => {
      const result = validateGtmId('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('rejects null', () => {
      const result = validateGtmId(null as unknown as string);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('rejects undefined', () => {
      const result = validateGtmId(undefined as unknown as string);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('rejects whitespace only', () => {
      const result = validateGtmId('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('common mistakes', () => {
    it('detects lowercase prefix', () => {
      const result = validateGtmId('gtm-ABC1234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('detects GA4 Measurement ID', () => {
      const result = validateGtmId('G-ABC123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('GA4 Measurement ID');
    });

    it('detects Universal Analytics ID', () => {
      const result = validateGtmId('UA-123456-1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Universal Analytics');
    });

    it('detects Google Ads ID', () => {
      const result = validateGtmId('AW-123456789');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Google Ads');
    });

    it('detects DoubleClick ID', () => {
      const result = validateGtmId('DC-123456');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('DoubleClick');
    });

    it('detects too short ID', () => {
      const result = validateGtmId('GTM-ABC');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('detects too long ID', () => {
      const result = validateGtmId('GTM-ABCDEFGHIJK');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('detects spaces in ID', () => {
      const result = validateGtmId('GTM-ABC 1234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('spaces');
    });

    it('suggests uppercase for lowercase suffix', () => {
      const result = validateGtmId('GTM-abc1234');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toContain('GTM-ABC1234');
    });
  });

  describe('suggestions', () => {
    it('provides helpful suggestions for invalid format', () => {
      const result = validateGtmId('ABC1234');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBeDefined();
    });
  });
});

describe('validateGtmIds', () => {
  it('accepts array of valid IDs', () => {
    const result = validateGtmIds(['GTM-ABC1234', 'GTM-XYZ5678']);
    expect(result.valid).toBe(true);
  });

  it('rejects empty array', () => {
    const result = validateGtmIds([]);
    expect(result.valid).toBe(false);
    expect(result.error?.toLowerCase()).toContain('at least one');
  });

  it('rejects array with invalid ID', () => {
    const result = validateGtmIds(['GTM-ABC1234', 'invalid']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('[1]');
  });

  it('warns about duplicate IDs', () => {
    const result = validateGtmIds(['GTM-ABC1234', 'GTM-ABC1234']);
    expect(result.valid).toBe(true);
    expect(result.warning).toContain('Duplicate');
  });
});

describe('validateDataLayerName', () => {
  describe('valid names', () => {
    it('accepts default dataLayer', () => {
      expect(validateDataLayerName('dataLayer')).toEqual({ valid: true });
    });

    it('accepts custom name', () => {
      const result = validateDataLayerName('customDataLayer');
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('custom');
    });

    it('accepts underscore prefix', () => {
      const result = validateDataLayerName('_dataLayer');
      expect(result.valid).toBe(true);
    });

    it('accepts dollar sign prefix', () => {
      const result = validateDataLayerName('$dataLayer');
      expect(result.valid).toBe(true);
    });

    it('accepts numbers after first char', () => {
      const result = validateDataLayerName('dataLayer2');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('rejects empty string', () => {
      const result = validateDataLayerName('');
      expect(result.valid).toBe(false);
    });

    it('rejects number prefix', () => {
      const result = validateDataLayerName('1dataLayer');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot start with a number');
    });

    it('rejects spaces', () => {
      const result = validateDataLayerName('data layer');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('spaces');
      expect(result.suggestion).toContain('data_layer');
    });

    it('rejects hyphens', () => {
      const result = validateDataLayerName('data-layer');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('hyphens');
      expect(result.suggestion).toContain('data_layer');
    });

    it('rejects reserved keywords', () => {
      const reservedWords = ['class', 'function', 'return', 'const', 'let', 'var'];

      for (const word of reservedWords) {
        const result = validateDataLayerName(word);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('reserved JavaScript keyword');
      }
    });
  });
});

describe('validateConfig', () => {
  it('validates complete valid config', () => {
    const result = validateConfig({
      containers: 'GTM-ABC1234'
    });
    expect(result.valid).toBe(true);
  });

  it('validates config with array of containers', () => {
    const result = validateConfig({
      containers: ['GTM-ABC1234', 'GTM-XYZ5678']
    });
    expect(result.valid).toBe(true);
  });

  it('validates config with data layer name', () => {
    const result = validateConfig({
      containers: 'GTM-ABC1234',
      dataLayerName: 'customDataLayer'
    });
    expect(result.valid).toBe(true);
    // Should have warning about custom name
    expect(result.warning).toContain('custom');
  });

  it('validates config with valid host', () => {
    const result = validateConfig({
      containers: 'GTM-ABC1234',
      host: 'https://custom.gtm.com'
    });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid container', () => {
    const result = validateConfig({
      containers: 'invalid'
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid host URL', () => {
    const result = validateConfig({
      containers: 'GTM-ABC1234',
      host: 'not-a-url'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid host URL');
  });

  it('rejects non-http/https host', () => {
    const result = validateConfig({
      containers: 'GTM-ABC1234',
      host: 'ftp://example.com'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('HTTP or HTTPS');
  });
});
