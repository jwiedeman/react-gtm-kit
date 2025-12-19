/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { GtmProvider } from '../provider';
import { useTrackPageViews } from '../route-tracker';

// Mock @remix-run/react
const mockLocation = {
  pathname: '/initial',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

jest.mock('@remix-run/react', () => ({
  useLocation: jest.fn(() => mockLocation)
}));

// Mock the core package
const mockPush = jest.fn();
jest.mock('@jwiedeman/gtm-kit', () => ({
  createGtmClient: jest.fn(() => ({
    init: jest.fn(),
    push: mockPush,
    setConsentDefaults: jest.fn(),
    updateConsent: jest.fn(),
    whenReady: jest.fn().mockResolvedValue([{ status: 'loaded' }]),
    onReady: jest.fn(),
    teardown: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true)
  }))
}));

// Access the mock for test manipulation
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const remixReactMock = require('@remix-run/react') as { useLocation: jest.Mock };

describe('useTrackPageViews', () => {
  const { useLocation } = remixReactMock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = '/initial';
    mockLocation.search = '';
    mockLocation.hash = '';
    useLocation.mockReturnValue({ ...mockLocation });
  });

  function TestComponent(props: Parameters<typeof useTrackPageViews>[0] = {}) {
    useTrackPageViews(props);
    return null;
  }

  it('tracks initial page view by default', () => {
    render(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent />
      </GtmProvider>
    );

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'page_view',
        page_path: '/initial'
      })
    );
  });

  it('does not track initial page view when disabled', () => {
    render(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent trackInitialPageView={false} />
      </GtmProvider>
    );

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('tracks page changes', () => {
    const { rerender } = render(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent />
      </GtmProvider>
    );

    // Clear initial page view
    mockPush.mockClear();

    // Simulate navigation
    mockLocation.pathname = '/new-page';
    useLocation.mockReturnValue({ ...mockLocation });

    rerender(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent />
      </GtmProvider>
    );

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'page_view',
        page_path: '/new-page'
      })
    );
  });

  it('uses custom event name', () => {
    render(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent eventName="virtual_page_view" />
      </GtmProvider>
    );

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'virtual_page_view'
      })
    );
  });

  it('includes custom data', () => {
    render(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent customData={{ app_version: '1.0.0' }} />
      </GtmProvider>
    );

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        app_version: '1.0.0'
      })
    );
  });

  it('applies transform function', () => {
    const transformEvent = jest.fn((data) => ({
      ...data,
      user_id: 'test-user'
    }));

    render(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent transformEvent={transformEvent} />
      </GtmProvider>
    );

    expect(transformEvent).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user'
      })
    );
  });

  it('includes search and hash in event', () => {
    mockLocation.pathname = '/page';
    mockLocation.search = '?query=test';
    mockLocation.hash = '#section';
    useLocation.mockReturnValue({ ...mockLocation });

    render(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent />
      </GtmProvider>
    );

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        page_path: '/page',
        page_search: '?query=test',
        page_hash: '#section'
      })
    );
  });

  it('does not double-fire for same path', () => {
    const { rerender } = render(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent />
      </GtmProvider>
    );

    expect(mockPush).toHaveBeenCalledTimes(1);

    // Re-render with same location
    rerender(
      <GtmProvider config={{ containers: 'GTM-TEST123' }}>
        <TestComponent />
      </GtmProvider>
    );

    // Should still only be called once
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
