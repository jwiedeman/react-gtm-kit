import {
  isValidContainerId,
  toContainerId,
  isValidDataLayerName,
  toDataLayerName,
  getGlobalDataLayer,
  getGoogleTagManager,
  type ContainerId,
  type DataLayerName
} from '../types';

describe('Type utilities', () => {
  describe('isValidContainerId', () => {
    it('returns true for valid GTM container IDs', () => {
      expect(isValidContainerId('GTM-ABC123')).toBe(true);
      expect(isValidContainerId('GTM-ABCDEF')).toBe(true);
      expect(isValidContainerId('GTM-123456')).toBe(true);
      expect(isValidContainerId('GTM-A1B2C3D4')).toBe(true);
      expect(isValidContainerId('gtm-abc123')).toBe(true); // case insensitive
    });

    it('returns false for invalid GTM container IDs', () => {
      expect(isValidContainerId('')).toBe(false);
      expect(isValidContainerId('GTM-')).toBe(false);
      expect(isValidContainerId('GTM-ABC')).toBe(false); // too short
      expect(isValidContainerId('GTM-AB12')).toBe(false); // too short
      expect(isValidContainerId('ABC-123456')).toBe(false); // wrong prefix
      expect(isValidContainerId('GTM123456')).toBe(false); // missing hyphen
      expect(isValidContainerId('UA-123456-1')).toBe(false); // Google Analytics ID
      expect(isValidContainerId('G-ABC123')).toBe(false); // GA4 measurement ID
    });

    it('correctly narrows the type', () => {
      const maybeContainerId = 'GTM-VALID1';
      if (isValidContainerId(maybeContainerId)) {
        // TypeScript should treat this as ContainerId
        const containerId: ContainerId = maybeContainerId;
        expect(containerId).toBe('GTM-VALID1');
      }
    });
  });

  describe('toContainerId', () => {
    it('returns ContainerId for valid IDs', () => {
      const containerId = toContainerId('GTM-ABC123');
      expect(containerId).toBe('GTM-ABC123');
    });

    it('throws for invalid IDs', () => {
      expect(() => toContainerId('')).toThrow('Invalid GTM container ID format');
      expect(() => toContainerId('GTM-ABC')).toThrow('Invalid GTM container ID format');
      expect(() => toContainerId('invalid')).toThrow('Invalid GTM container ID format');
    });

    it('includes the invalid value in error message', () => {
      expect(() => toContainerId('bad-id')).toThrow('bad-id');
    });
  });

  describe('getGlobalDataLayer', () => {
    beforeEach(() => {
      // Clean up any existing dataLayer
      delete (globalThis as Record<string, unknown>).dataLayer;
      delete (globalThis as Record<string, unknown>).customLayer;
    });

    it('returns undefined when dataLayer does not exist', () => {
      expect(getGlobalDataLayer()).toBeUndefined();
    });

    it('returns the dataLayer when it exists', () => {
      (globalThis as Record<string, unknown>).dataLayer = [{ event: 'test' }];
      const result = getGlobalDataLayer();
      expect(result).toEqual([{ event: 'test' }]);
    });

    it('supports custom dataLayer names', () => {
      (globalThis as Record<string, unknown>).customLayer = [{ event: 'custom' }];
      const result = getGlobalDataLayer('customLayer');
      expect(result).toEqual([{ event: 'custom' }]);
    });

    it('returns undefined for non-array values', () => {
      (globalThis as Record<string, unknown>).dataLayer = 'not an array';
      expect(getGlobalDataLayer()).toBeUndefined();

      (globalThis as Record<string, unknown>).dataLayer = { notAnArray: true };
      expect(getGlobalDataLayer()).toBeUndefined();

      (globalThis as Record<string, unknown>).dataLayer = null;
      expect(getGlobalDataLayer()).toBeUndefined();
    });
  });

  describe('getGoogleTagManager', () => {
    beforeEach(() => {
      delete (globalThis as Record<string, unknown>).google_tag_manager;
    });

    it('returns undefined when google_tag_manager does not exist', () => {
      expect(getGoogleTagManager()).toBeUndefined();
    });

    it('returns google_tag_manager when it exists', () => {
      const gtm = { 'GTM-ABC123': { dataLayer: {} } };
      (globalThis as Record<string, unknown>).google_tag_manager = gtm;
      const result = getGoogleTagManager();
      expect(result).toBe(gtm);
    });

    it('can be used to check container initialization', () => {
      const gtm = { 'GTM-CONTAINER': { initialized: true } };
      (globalThis as Record<string, unknown>).google_tag_manager = gtm;

      const result = getGoogleTagManager();
      expect(result?.['GTM-CONTAINER']).toBeDefined();
      expect(result?.['GTM-OTHER']).toBeUndefined();
    });
  });

  describe('isValidDataLayerName', () => {
    it('returns true for valid JavaScript identifiers', () => {
      expect(isValidDataLayerName('dataLayer')).toBe(true);
      expect(isValidDataLayerName('myCustomLayer')).toBe(true);
      expect(isValidDataLayerName('gtm_data')).toBe(true);
      expect(isValidDataLayerName('_privateLayer')).toBe(true);
      expect(isValidDataLayerName('$specialLayer')).toBe(true);
      expect(isValidDataLayerName('layer123')).toBe(true);
      expect(isValidDataLayerName('DataLayer')).toBe(true);
      expect(isValidDataLayerName('DATALAYER')).toBe(true);
      expect(isValidDataLayerName('a')).toBe(true); // single letter
      expect(isValidDataLayerName('_')).toBe(true); // single underscore
      expect(isValidDataLayerName('$')).toBe(true); // single dollar sign
    });

    it('returns false for invalid JavaScript identifiers', () => {
      expect(isValidDataLayerName('')).toBe(false); // empty
      expect(isValidDataLayerName('123invalid')).toBe(false); // starts with number
      expect(isValidDataLayerName('data-layer')).toBe(false); // contains hyphen
      expect(isValidDataLayerName('data layer')).toBe(false); // contains space
      expect(isValidDataLayerName('data.layer')).toBe(false); // contains dot
      expect(isValidDataLayerName('data[layer]')).toBe(false); // contains brackets
      expect(isValidDataLayerName("data'layer")).toBe(false); // contains quote
      expect(isValidDataLayerName('data"layer')).toBe(false); // contains double quote
      expect(isValidDataLayerName('data<script>')).toBe(false); // contains angle brackets
    });

    it('returns false for JavaScript reserved words', () => {
      expect(isValidDataLayerName('class')).toBe(false);
      expect(isValidDataLayerName('function')).toBe(false);
      expect(isValidDataLayerName('return')).toBe(false);
      expect(isValidDataLayerName('var')).toBe(false);
      expect(isValidDataLayerName('let')).toBe(false);
      expect(isValidDataLayerName('const')).toBe(false);
      expect(isValidDataLayerName('if')).toBe(false);
      expect(isValidDataLayerName('else')).toBe(false);
      expect(isValidDataLayerName('for')).toBe(false);
      expect(isValidDataLayerName('while')).toBe(false);
      expect(isValidDataLayerName('null')).toBe(false);
      expect(isValidDataLayerName('true')).toBe(false);
      expect(isValidDataLayerName('false')).toBe(false);
      expect(isValidDataLayerName('eval')).toBe(false);
      expect(isValidDataLayerName('arguments')).toBe(false);
    });

    it('returns false for XSS attack patterns', () => {
      expect(isValidDataLayerName("dataLayer'];alert('XSS');//")).toBe(false);
      expect(isValidDataLayerName("dataLayer\"];alert('XSS');//")).toBe(false);
      expect(isValidDataLayerName('dataLayer<script>alert(1)</script>')).toBe(false);
      expect(isValidDataLayerName("dataLayer');eval('alert(1)');//")).toBe(false);
    });

    it('correctly narrows the type', () => {
      const maybeName = 'dataLayer';
      if (isValidDataLayerName(maybeName)) {
        // TypeScript should treat this as DataLayerName
        const name: DataLayerName = maybeName;
        expect(name).toBe('dataLayer');
      }
    });
  });

  describe('toDataLayerName', () => {
    it('returns DataLayerName for valid names', () => {
      const name = toDataLayerName('dataLayer');
      expect(name).toBe('dataLayer');
    });

    it('throws for invalid names', () => {
      expect(() => toDataLayerName('')).toThrow('Invalid dataLayer name');
      expect(() => toDataLayerName('123invalid')).toThrow('Invalid dataLayer name');
      expect(() => toDataLayerName('data-layer')).toThrow('Invalid dataLayer name');
    });

    it('throws for reserved words', () => {
      expect(() => toDataLayerName('class')).toThrow('Invalid dataLayer name');
      expect(() => toDataLayerName('function')).toThrow('Invalid dataLayer name');
    });

    it('includes the invalid value in error message', () => {
      expect(() => toDataLayerName('bad-name')).toThrow('bad-name');
    });

    it('includes helpful example in error message', () => {
      expect(() => toDataLayerName('123')).toThrow('Example:');
    });
  });
});
