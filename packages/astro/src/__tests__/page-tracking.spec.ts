import { trackPageView, setupViewTransitions, setupPageTracking, _resetPageTrackingState } from '../page-tracking';
import { initGtm, teardown } from '../client';

// Mock the core module
jest.mock('@jwiedeman/gtm-kit', () => {
  const mockClient = {
    init: jest.fn(),
    push: jest.fn(),
    setConsentDefaults: jest.fn(),
    updateConsent: jest.fn(),
    teardown: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true),
    whenReady: jest.fn().mockResolvedValue([]),
    onReady: jest.fn(),
    dataLayerName: 'dataLayer'
  };

  return {
    createGtmClient: jest.fn().mockReturnValue(mockClient),
    DEFAULT_DATA_LAYER_NAME: 'dataLayer',
    __mockClient: mockClient
  };
});

const { __mockClient: mockClient } = jest.requireMock('@jwiedeman/gtm-kit');

describe('Astro Page Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    teardown();
    _resetPageTrackingState();

    // Reset location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/test-page',
        search: '?foo=bar',
        href: 'https://example.com/test-page?foo=bar'
      },
      writable: true
    });

    // Reset document title
    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true
    });
  });

  describe('trackPageView', () => {
    it('should push page view event with default values', () => {
      initGtm({ containers: 'GTM-TEST123' });
      trackPageView();

      expect(mockClient.push).toHaveBeenCalledWith({
        event: 'page_view',
        page_path: '/test-page?foo=bar',
        page_location: 'https://example.com/test-page?foo=bar',
        page_title: 'Test Page'
      });
    });

    it('should use custom event name', () => {
      initGtm({ containers: 'GTM-TEST123' });
      trackPageView({ eventName: 'custom_page_view' });

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'custom_page_view'
        })
      );
    });

    it('should exclude query params when configured', () => {
      initGtm({ containers: 'GTM-TEST123' });
      trackPageView({ includeQueryParams: false });

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          page_path: '/test-page'
        })
      );
    });

    it('should include additional data', () => {
      initGtm({ containers: 'GTM-TEST123' });
      trackPageView({
        additionalData: { user_type: 'guest', section: 'blog' }
      });

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          user_type: 'guest',
          section: 'blog'
        })
      );
    });

    it('should support function for additional data', () => {
      initGtm({ containers: 'GTM-TEST123' });

      let callCount = 0;
      trackPageView({
        additionalData: () => {
          callCount++;
          return { call_count: callCount };
        }
      });

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          call_count: 1
        })
      );
    });
  });

  describe('setupViewTransitions', () => {
    it('should track initial page view', () => {
      initGtm({ containers: 'GTM-TEST123' });
      setupViewTransitions();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'page_view',
          page_path: '/test-page?foo=bar'
        })
      );
    });

    it('should return cleanup function', () => {
      initGtm({ containers: 'GTM-TEST123' });
      const cleanup = setupViewTransitions();

      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should listen to astro:page-load event', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      initGtm({ containers: 'GTM-TEST123' });
      setupViewTransitions();

      expect(addEventListenerSpy).toHaveBeenCalledWith('astro:page-load', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should use custom options', () => {
      initGtm({ containers: 'GTM-TEST123' });
      setupViewTransitions({
        eventName: 'custom_page_view',
        additionalData: { site: 'test' }
      });

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'custom_page_view',
          site: 'test'
        })
      );
    });
  });

  describe('setupPageTracking', () => {
    it('should track initial page view', () => {
      initGtm({ containers: 'GTM-TEST123' });
      setupPageTracking();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'page_view'
        })
      );
    });

    it('should listen to popstate event', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      initGtm({ containers: 'GTM-TEST123' });
      setupPageTracking();

      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should return cleanup function that removes listener', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      initGtm({ containers: 'GTM-TEST123' });
      const cleanup = setupPageTracking();
      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
