import { ScriptManager } from '../script-manager';
import type { ScriptLoadState } from '../types';

describe('ScriptManager', () => {
  const createManager = (options?: Partial<ConstructorParameters<typeof ScriptManager>[0]>) =>
    new ScriptManager({ instanceId: 'test-instance', ...(options ?? {}) });

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('injects scripts with merged query params, host overrides, and attributes', () => {
    const manager = createManager({
      host: 'https://tag.example.com/',
      defaultQueryParams: { gtm_auth: 'auth-token' },
      scriptAttributes: { async: false, nonce: 'nonce-123', 'data-env': 'staging' }
    });

    const { inserted } = manager.ensure([{ id: 'GTM-ABC', queryParams: { gtm_preview: 'env-1' } }]);

    expect(inserted).toHaveLength(1);

    const script = inserted[0];
    const url = new URL(script.src);
    expect(url.origin).toBe('https://tag.example.com');
    expect(url.pathname).toBe('/gtm.js');
    expect(url.searchParams.get('id')).toBe('GTM-ABC');
    expect(url.searchParams.get('gtm_auth')).toBe('auth-token');
    expect(url.searchParams.get('gtm_preview')).toBe('env-1');
    expect(script.getAttribute('data-gtm-container-id')).toBe('GTM-ABC');
    expect(script.getAttribute('data-gtm-kit-instance')).toBe('test-instance');
    expect(script.nonce).toBe('nonce-123');
    expect(script.getAttribute('data-env')).toBe('staging');
    expect(script.async).toBe(false);
  });

  it('records cached scripts and avoids duplicate injection', async () => {
    const existing = document.createElement('script');
    existing.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-CACHED';
    existing.setAttribute('data-gtm-container-id', 'GTM-CACHED');
    document.head.appendChild(existing);

    const manager = createManager();
    const readyPromise = manager.whenReady();
    const { inserted } = manager.ensure([{ id: 'GTM-CACHED' }]);

    expect(inserted).toHaveLength(0);

    const states = await readyPromise;
    expect(states).toEqual<ScriptLoadState[]>([
      {
        containerId: 'GTM-CACHED',
        src: existing.src,
        status: 'loaded',
        fromCache: true
      }
    ]);
  });

  it('resolves readiness after load events and surfaces failures', async () => {
    const manager = createManager();
    const { inserted } = manager.ensure([{ id: 'GTM-READY' }, { id: 'GTM-FAIL' }]);

    const readyPromise = manager.whenReady();

    inserted[0].dispatchEvent(new Event('load'));
    inserted[1].dispatchEvent(new Event('error'));

    const states = await readyPromise;

    expect(states).toEqual(
      expect.arrayContaining<ScriptLoadState>([
        expect.objectContaining({ containerId: 'GTM-READY', status: 'loaded' }),
        expect.objectContaining({ containerId: 'GTM-FAIL', status: 'failed', error: 'Failed to load GTM script.' })
      ])
    );
  });

  it('tears down inserted scripts and resets readiness tracking', async () => {
    const manager = createManager();
    const { inserted } = manager.ensure([{ id: 'GTM-TEARDOWN' }]);
    const initialReady = manager.whenReady();

    inserted[0].dispatchEvent(new Event('load'));
    await initialReady;

    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(1);

    manager.teardown();

    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
    expect(manager.whenReady()).not.toBe(initialReady);
  });

  it('notifies ready callbacks when scripts finish loading', async () => {
    const manager = createManager();
    const callback = jest.fn();

    manager.onReady(callback);
    const { inserted } = manager.ensure([{ id: 'GTM-CALLBACK' }]);

    inserted[0].dispatchEvent(new Event('load'));

    const states = await manager.whenReady();

    expect(callback).toHaveBeenCalledWith(states);
    expect(states).toEqual(
      expect.arrayContaining<ScriptLoadState>([
        expect.objectContaining({ containerId: 'GTM-CALLBACK', status: 'loaded' })
      ])
    );
  });

  it('invokes onReady immediately for late subscribers after readiness settles', async () => {
    const manager = createManager();
    const { inserted } = manager.ensure([{ id: 'GTM-LATE' }]);

    inserted[0].dispatchEvent(new Event('load'));
    const settled = await manager.whenReady();

    const callback = jest.fn();
    manager.onReady(callback);

    expect(callback).toHaveBeenCalledWith(settled);
  });

  it('defaults to async scripts when no attributes are provided', () => {
    const manager = createManager();
    const { inserted } = manager.ensure([{ id: 'GTM-DEFAULTS' }]);

    expect(inserted[0].async).toBe(true);
    expect(inserted[0].defer).toBe(false);
  });

  it('respects an explicit defer attribute when provided', () => {
    const manager = createManager({ scriptAttributes: { defer: true } });
    const { inserted } = manager.ensure([{ id: 'GTM-DEFER' }]);

    expect(inserted[0].defer).toBe(true);
  });

  it('skips containers with missing ids and resolves readiness', async () => {
    const manager = createManager();
    const readiness = manager.whenReady();

    const result = manager.ensure([{ id: '' } as { id: string }]);

    expect(result.inserted).toHaveLength(0);
    expect(await readiness).toEqual([]);
  });

  it('captures detailed error messages from failing scripts', async () => {
    const manager = createManager();
    const { inserted } = manager.ensure([{ id: 'GTM-ERROR-MESSAGE' }]);

    const ready = manager.whenReady();
    inserted[0].dispatchEvent(new ErrorEvent('error', { message: 'Network failed', error: new Error('Network failed') }));

    const states = await ready;
    expect(states).toEqual(
      expect.arrayContaining<ScriptLoadState>([
        expect.objectContaining({
          containerId: 'GTM-ERROR-MESSAGE',
          status: 'failed',
          error: 'Error: Network failed'
        })
      ])
    );
  });

  it('resolves readiness immediately when no containers are provided', async () => {
    const manager = createManager();
    const readiness = manager.whenReady();

    const result = manager.ensure([]);

    expect(result.inserted).toHaveLength(0);
    expect(await readiness).toEqual([]);
  });

});
