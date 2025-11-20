import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import type { PageViewPayload, ScriptLoadState } from '@react-gtm-kit/core';
import type { UseTrackPageViewsOptions } from '../route-listener';
import { useTrackPageViews } from '../route-listener';
import { __resetMockNavigation, __setMockPathname, __setMockSearchParams } from '../__mocks__/next/navigation';

describe('useTrackPageViews', () => {
  const createClient = () => ({
    push: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve<ScriptLoadState[]>([]))
  });

  interface HarnessProps {
    client: ReturnType<typeof createClient>;
    options?: Partial<Omit<UseTrackPageViewsOptions, 'client'>>;
  }

  const Harness: React.FC<HarnessProps> = ({ client, options }) => {
    useTrackPageViews({
      client,
      ...(options ?? {})
    });

    return null;
  };

  beforeEach(() => {
    __resetMockNavigation();
    window.location.hash = '';
    document.title = '';
  });

  it('pushes a page view on initial render with path, search, and title', () => {
    const client = createClient();
    __setMockPathname('/initial');
    __setMockSearchParams(new URLSearchParams('foo=bar'));
    document.title = 'Initial Page';

    render(<Harness client={client} />);

    expect(client.push).toHaveBeenCalledTimes(1);
    expect(client.push).toHaveBeenCalledWith({
      event: 'page_view',
      page_path: '/initial?foo=bar',
      page_location: 'http://localhost/initial?foo=bar',
      page_title: 'Initial Page'
    });
  });

  it('pushes a new event when the route changes', () => {
    const client = createClient();
    __setMockPathname('/one');
    __setMockSearchParams(new URLSearchParams('first=1'));
    document.title = 'First';

    const { rerender } = render(<Harness client={client} />);

    expect(client.push).toHaveBeenCalledTimes(1);

    act(() => {
      __setMockPathname('/two');
      __setMockSearchParams(new URLSearchParams('second=2'));
      document.title = 'Second';
      rerender(<Harness client={client} />);
    });

    expect(client.push).toHaveBeenCalledTimes(2);
    expect(client.push).toHaveBeenLastCalledWith({
      event: 'page_view',
      page_path: '/two?second=2',
      page_location: 'http://localhost/two?second=2',
      page_title: 'Second'
    });
  });

  it('does not push a duplicate event when the route is unchanged by default', () => {
    const client = createClient();
    __setMockPathname('/same');
    __setMockSearchParams(new URLSearchParams('value=1'));

    const { rerender } = render(<Harness client={client} />);
    expect(client.push).toHaveBeenCalledTimes(1);

    act(() => {
      rerender(<Harness client={client} />);
    });

    expect(client.push).toHaveBeenCalledTimes(1);
  });

  it('includes hash changes when trackHash is enabled', () => {
    const client = createClient();
    __setMockPathname('/hash');
    document.title = 'Hash Page';
    window.location.hash = '#first';

    render(<Harness client={client} options={{ trackHash: true }} />);
    expect(client.push).toHaveBeenCalledTimes(1);
    expect(client.push).toHaveBeenLastCalledWith({
      event: 'page_view',
      page_path: '/hash',
      page_location: 'http://localhost/hash#first',
      page_title: 'Hash Page'
    });

    act(() => {
      window.location.hash = '#second';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(client.push).toHaveBeenCalledTimes(2);
    expect(client.push).toHaveBeenLastCalledWith({
      event: 'page_view',
      page_path: '/hash',
      page_location: 'http://localhost/hash#second',
      page_title: 'Hash Page'
    });
  });

  it('omits search parameters when includeSearchParams is false', () => {
    const client = createClient();
    __setMockPathname('/clean');
    __setMockSearchParams(new URLSearchParams('ignored=yes'));

    render(<Harness client={client} options={{ includeSearchParams: false }} />);

    expect(client.push).toHaveBeenCalledWith({
      event: 'page_view',
      page_path: '/clean',
      page_location: 'http://localhost/clean'
    });
  });

  it('skips the initial event when trackOnMount is false but tracks subsequent changes', () => {
    const client = createClient();
    __setMockPathname('/initial');

    const { rerender } = render(<Harness client={client} options={{ trackOnMount: false }} />);
    expect(client.push).not.toHaveBeenCalled();

    act(() => {
      __setMockPathname('/next');
      rerender(<Harness client={client} options={{ trackOnMount: false }} />);
    });

    expect(client.push).toHaveBeenCalledTimes(1);
    expect(client.push).toHaveBeenLastCalledWith({
      event: 'page_view',
      page_path: '/next',
      page_location: 'http://localhost/next'
    });
  });

  it('waits for GTM readiness when enabled', async () => {
    const client = createClient();
    __setMockPathname('/delayed');

    let resolveReady: ((value: ScriptLoadState[]) => void) | undefined;
    const readiness = new Promise<ScriptLoadState[]>((resolve) => {
      resolveReady = resolve;
    });

    (client.whenReady as jest.Mock).mockReturnValueOnce(readiness);

    render(<Harness client={client} options={{ waitForReady: true }} />);

    expect(client.whenReady).toHaveBeenCalled();
    expect(client.push).not.toHaveBeenCalled();

    act(() => {
      resolveReady?.([{ containerId: 'GTM-DELAYED', status: 'loaded' }]);
    });

    await waitFor(() => {
      expect(client.push).toHaveBeenCalledTimes(1);
    });
  });

  it('supports custom payload builders and event names', () => {
    const client = createClient();
    __setMockPathname('/custom');
    document.title = 'Custom Page';

    const buildPayload = jest.fn(() => ({ custom: true }) as unknown as PageViewPayload);

    render(<Harness client={client} options={{ eventName: 'custom_event', buildPayload }} />);

    expect(buildPayload).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/custom', pagePath: '/custom' }));
    expect(client.push).toHaveBeenCalledWith({
      event: 'custom_event',
      custom: true
    });
  });
});
