/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GtmProvider, useGtm, useGtmPush, useGtmConsent, useGtmClient, useGtmReady } from '../provider';

// Mock the core package
jest.mock('@jwiedeman/gtm-kit', () => ({
  createGtmClient: jest.fn((options) => ({
    init: jest.fn(),
    push: jest.fn(),
    setConsentDefaults: jest.fn(),
    updateConsent: jest.fn(),
    whenReady: jest.fn().mockResolvedValue([{ status: 'loaded' }]),
    onReady: jest.fn((cb) => {
      cb([{ status: 'loaded' }]);
      return () => {
        /* cleanup */
      };
    }),
    teardown: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true),
    options
  }))
}));

describe('@jwiedeman/gtm-kit-remix Provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((el) => el.remove());
    document.querySelectorAll('[data-gtm-kit-provider]').forEach((el) => el.remove());
  });

  describe('GtmProvider', () => {
    it('renders children', () => {
      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }}>
          <div data-testid="child">Hello</div>
        </GtmProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides GTM context to children', () => {
      let result: any;

      function TestComponent() {
        result = useGtm();
        return null;
      }

      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }}>
          <TestComponent />
        </GtmProvider>
      );

      expect(result).toBeDefined();
      expect(result.client).toBeDefined();
      expect(result.push).toBeInstanceOf(Function);
    });

    it('calls onBeforeInit before initialization', () => {
      const onBeforeInit = jest.fn();

      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }} onBeforeInit={onBeforeInit}>
          <div />
        </GtmProvider>
      );

      expect(onBeforeInit).toHaveBeenCalled();
    });

    it('calls onAfterInit after initialization', () => {
      const onAfterInit = jest.fn();

      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }} onAfterInit={onAfterInit}>
          <div />
        </GtmProvider>
      );

      expect(onAfterInit).toHaveBeenCalled();
    });
  });

  describe('useGtmPush', () => {
    it('returns push function', () => {
      let push: any;

      function TestComponent() {
        push = useGtmPush();
        return null;
      }

      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }}>
          <TestComponent />
        </GtmProvider>
      );

      expect(push).toBeInstanceOf(Function);
    });

    it('push calls client.push', () => {
      let push: any;
      let client: any;

      function TestComponent() {
        push = useGtmPush();
        client = useGtmClient();
        return null;
      }

      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }}>
          <TestComponent />
        </GtmProvider>
      );

      act(() => {
        push({ event: 'test', value: 123 });
      });

      expect(client.push).toHaveBeenCalledWith({ event: 'test', value: 123 });
    });
  });

  describe('useGtmConsent', () => {
    it('returns consent functions', () => {
      let consent: any;

      function TestComponent() {
        consent = useGtmConsent();
        return null;
      }

      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }}>
          <TestComponent />
        </GtmProvider>
      );

      expect(consent.setConsentDefaults).toBeInstanceOf(Function);
      expect(consent.updateConsent).toBeInstanceOf(Function);
    });
  });

  describe('useGtmClient', () => {
    it('returns the GTM client', () => {
      let client: any;

      function TestComponent() {
        client = useGtmClient();
        return null;
      }

      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }}>
          <TestComponent />
        </GtmProvider>
      );

      expect(client).toBeDefined();
      expect(client.init).toBeDefined();
    });
  });

  describe('useGtmReady', () => {
    it('returns whenReady function', async () => {
      let whenReady: any;

      function TestComponent() {
        whenReady = useGtmReady();
        return null;
      }

      render(
        <GtmProvider config={{ containers: 'GTM-TEST123' }}>
          <TestComponent />
        </GtmProvider>
      );

      expect(whenReady).toBeInstanceOf(Function);
      const result = await whenReady();
      expect(result).toEqual([{ status: 'loaded' }]);
    });
  });

  describe('error handling', () => {
    it('throws error when useGtm is called outside provider', () => {
      function TestComponent() {
        useGtm();
        return null;
      }

      // Suppress React error boundary logs
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        /* suppress */
      });

      expect(() => {
        render(<TestComponent />);
      }).toThrow('[gtm-kit] useGtm() was called outside of a GtmProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('multiple containers', () => {
    it('handles array of containers', () => {
      let result: any;

      function TestComponent() {
        result = useGtm();
        return null;
      }

      render(
        <GtmProvider config={{ containers: [{ id: 'GTM-FIRST' }, { id: 'GTM-SECOND' }] }}>
          <TestComponent />
        </GtmProvider>
      );

      expect(result.client).toBeDefined();
    });
  });
});
