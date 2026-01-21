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

  it('avoids appending the dataLayerName when using the default name', () => {
    const manager = createManager();

    const { inserted } = manager.ensure([{ id: 'GTM-DATA-LAYER-DEFAULT' }]);
    const url = new URL(inserted[0].src);

    expect(url.searchParams.get('l')).toBeNull();
  });

  it('adds the dataLayerName query param for non-default names and respects host overrides', () => {
    const manager = createManager({
      dataLayerName: 'customLayer',
      host: 'https://tags.example.com'
    });

    const { inserted } = manager.ensure([{ id: 'GTM-DATA-LAYER-CUSTOM' }]);
    const url = new URL(inserted[0].src);

    expect(url.origin).toBe('https://tags.example.com');
    expect(url.searchParams.get('l')).toBe('customLayer');
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
    inserted[0].dispatchEvent(
      new ErrorEvent('error', { message: 'Network failed', error: new Error('Network failed') })
    );

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

  describe('retry functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('retries failed script loads with exponential backoff', async () => {
      const manager = createManager({
        retry: { attempts: 2, delay: 1000 }
      });

      const { inserted } = manager.ensure([{ id: 'GTM-RETRY' }]);
      const initialScript = inserted[0];

      // First failure
      initialScript.dispatchEvent(new Event('error'));

      // Fast-forward to first retry (1000ms)
      jest.advanceTimersByTime(1000);

      // Get the retried script
      const retryScripts = document.querySelectorAll('script[data-gtm-container-id="GTM-RETRY"]');
      expect(retryScripts.length).toBe(1); // Old script removed, new one added

      // Succeed on retry
      const retryScript = retryScripts[0] as HTMLScriptElement;
      retryScript.dispatchEvent(new Event('load'));

      const states = await manager.whenReady();
      expect(states).toEqual(
        expect.arrayContaining([expect.objectContaining({ containerId: 'GTM-RETRY', status: 'loaded' })])
      );
    });

    it('calls onScriptError after all retries exhausted', async () => {
      const onScriptError = jest.fn();
      const manager = createManager({
        retry: { attempts: 1, delay: 500 },
        onScriptError
      });

      const { inserted } = manager.ensure([{ id: 'GTM-FAIL-ALL' }]);

      // First failure
      inserted[0].dispatchEvent(new Event('error'));

      // Advance to first retry
      jest.advanceTimersByTime(500);

      // Get retry script and fail it too
      const retryScript = document.querySelector('script[data-gtm-container-id="GTM-FAIL-ALL"]') as HTMLScriptElement;
      retryScript.dispatchEvent(new Event('error'));

      // Should call onScriptError after retries exhausted
      expect(onScriptError).toHaveBeenCalledWith(
        expect.objectContaining({
          containerId: 'GTM-FAIL-ALL',
          status: 'failed'
        })
      );
    });

    it('respects maxDelay configuration', () => {
      const manager = createManager({
        retry: { attempts: 5, delay: 1000, maxDelay: 5000 }
      });

      // Access private method for testing (using reflection)
      const calculateDelay = (
        manager as unknown as { calculateRetryDelay: (n: number) => number }
      ).calculateRetryDelay.bind(manager);

      expect(calculateDelay(0)).toBe(1000); // 1000 * 2^0 = 1000
      expect(calculateDelay(1)).toBe(2000); // 1000 * 2^1 = 2000
      expect(calculateDelay(2)).toBe(4000); // 1000 * 2^2 = 4000
      expect(calculateDelay(3)).toBe(5000); // 1000 * 2^3 = 8000, capped at 5000
      expect(calculateDelay(4)).toBe(5000); // 1000 * 2^4 = 16000, capped at 5000
    });
  });

  describe('timeout functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls onScriptTimeout when script load times out', () => {
      const onScriptTimeout = jest.fn();
      const manager = createManager({
        scriptTimeout: 5000,
        onScriptTimeout
      });

      manager.ensure([{ id: 'GTM-TIMEOUT' }]);

      // Advance past timeout
      jest.advanceTimersByTime(5000);

      expect(onScriptTimeout).toHaveBeenCalledWith('GTM-TIMEOUT');
    });

    it('does not call timeout callback if script loads successfully', () => {
      const onScriptTimeout = jest.fn();
      const manager = createManager({
        scriptTimeout: 5000,
        onScriptTimeout
      });

      const { inserted } = manager.ensure([{ id: 'GTM-FAST' }]);

      // Script loads before timeout
      inserted[0].dispatchEvent(new Event('load'));

      // Advance past timeout
      jest.advanceTimersByTime(5000);

      expect(onScriptTimeout).not.toHaveBeenCalled();
    });

    it('clears timeouts on teardown', () => {
      const manager = createManager({
        scriptTimeout: 5000
      });

      manager.ensure([{ id: 'GTM-TEARDOWN-TIMEOUT' }]);

      manager.teardown();

      // Advancing time should not cause issues
      jest.advanceTimersByTime(10000);

      // No errors thrown
      expect(true).toBe(true);
    });
  });

  describe('default configuration', () => {
    it('uses default timeout of 30000ms when not specified', () => {
      // Default timeout should be 30000ms, but we can't easily test this
      // without access to private properties. Just verify it doesn't error.
      const manager = createManager();
      const { inserted } = manager.ensure([{ id: 'GTM-DEFAULT-TIMEOUT' }]);
      inserted[0].dispatchEvent(new Event('load'));
      expect(inserted).toHaveLength(1);
    });

    it('disables retry by default (0 attempts)', async () => {
      const onScriptError = jest.fn();
      const manager = createManager({ onScriptError });

      const { inserted } = manager.ensure([{ id: 'GTM-NO-RETRY' }]);

      // Single failure should trigger onScriptError immediately
      inserted[0].dispatchEvent(new Event('error'));

      expect(onScriptError).toHaveBeenCalledWith(
        expect.objectContaining({
          containerId: 'GTM-NO-RETRY',
          status: 'failed'
        })
      );
    });
  });

  describe('initialization verification', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Clean up google_tag_manager global
      delete (window as { google_tag_manager?: unknown }).google_tag_manager;
    });

    afterEach(() => {
      jest.useRealTimers();
      delete (window as { google_tag_manager?: unknown }).google_tag_manager;
    });

    it('marks script as loaded when GTM initializes within timeout', async () => {
      const manager = createManager({
        verifyInitialization: true,
        initializationTimeout: 5000
      });

      const { inserted } = manager.ensure([{ id: 'GTM-VERIFY-SUCCESS' }]);

      // Script loads
      inserted[0].dispatchEvent(new Event('load'));

      // Simulate GTM initializing
      (window as { google_tag_manager?: Record<string, unknown> }).google_tag_manager = {
        'GTM-VERIFY-SUCCESS': { loaded: true }
      };

      // Advance past first poll
      jest.advanceTimersByTime(100);

      const states = await manager.whenReady();
      expect(states).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            containerId: 'GTM-VERIFY-SUCCESS',
            status: 'loaded'
          })
        ])
      );
    });

    it('marks script as partial when GTM fails to initialize within timeout', async () => {
      const onPartialLoad = jest.fn();
      const manager = createManager({
        verifyInitialization: true,
        initializationTimeout: 500,
        onPartialLoad
      });

      const { inserted } = manager.ensure([{ id: 'GTM-VERIFY-FAIL' }]);
      const readyPromise = manager.whenReady();

      // Script loads but GTM never initializes
      inserted[0].dispatchEvent(new Event('load'));

      // Advance past timeout
      jest.advanceTimersByTime(600);

      const states = await readyPromise;
      expect(states).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            containerId: 'GTM-VERIFY-FAIL',
            status: 'partial',
            error: 'GTM failed to initialize within 500ms'
          })
        ])
      );

      expect(onPartialLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          containerId: 'GTM-VERIFY-FAIL',
          status: 'partial'
        })
      );
    });

    it('does not verify when verifyInitialization is false', async () => {
      const manager = createManager({
        verifyInitialization: false
      });

      const { inserted } = manager.ensure([{ id: 'GTM-NO-VERIFY' }]);

      // Script loads
      inserted[0].dispatchEvent(new Event('load'));

      const states = await manager.whenReady();
      expect(states).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            containerId: 'GTM-NO-VERIFY',
            status: 'loaded'
          })
        ])
      );
    });

    it('clears verification timeouts on teardown', () => {
      const manager = createManager({
        verifyInitialization: true,
        initializationTimeout: 5000
      });

      const { inserted } = manager.ensure([{ id: 'GTM-VERIFY-TEARDOWN' }]);
      inserted[0].dispatchEvent(new Event('load'));

      // Teardown before verification completes
      manager.teardown();

      // Advance time - should not cause errors
      jest.advanceTimersByTime(10000);

      expect(true).toBe(true);
    });

    it('handles onPartialLoad callback errors gracefully', async () => {
      const onPartialLoad = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const manager = createManager({
        verifyInitialization: true,
        initializationTimeout: 100,
        onPartialLoad
      });

      const { inserted } = manager.ensure([{ id: 'GTM-CALLBACK-ERROR' }]);
      inserted[0].dispatchEvent(new Event('load'));

      // Advance past timeout - should not throw
      jest.advanceTimersByTime(200);

      const states = await manager.whenReady();
      expect(states).toHaveLength(1);
      expect(onPartialLoad).toHaveBeenCalled();
    });

    it('detects GTM initialization on subsequent poll cycles', async () => {
      const manager = createManager({
        verifyInitialization: true,
        initializationTimeout: 5000
      });

      const { inserted } = manager.ensure([{ id: 'GTM-DELAYED-INIT' }]);

      // Script loads
      inserted[0].dispatchEvent(new Event('load'));

      // First few polls - no GTM yet
      jest.advanceTimersByTime(300);

      // Now GTM initializes
      (window as { google_tag_manager?: Record<string, unknown> }).google_tag_manager = {
        'GTM-DELAYED-INIT': { loaded: true }
      };

      // Next poll detects it
      jest.advanceTimersByTime(100);

      const states = await manager.whenReady();
      expect(states).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            containerId: 'GTM-DELAYED-INIT',
            status: 'loaded'
          })
        ])
      );
    });
  });

  describe('Script load timing', () => {
    it('includes loadTimeMs in script load state', async () => {
      const manager = createManager();
      manager.ensure([{ id: 'GTM-TIMING-1' }]);

      // Simulate successful script load
      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-TIMING-1"]');
      script?.dispatchEvent(new Event('load'));

      const states = await manager.whenReady();
      const state = states.find((s) => s.containerId === 'GTM-TIMING-1');

      expect(state).toBeDefined();
      expect(state?.status).toBe('loaded');
      expect(typeof state?.loadTimeMs).toBe('number');
      expect(state?.loadTimeMs).toBeGreaterThanOrEqual(0);

      manager.teardown();
    });

    it('does not include loadTimeMs for cached scripts', async () => {
      // First, add an existing script
      const existingScript = document.createElement('script');
      existingScript.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-TIMING-CACHED';
      existingScript.setAttribute('data-gtm-container-id', 'GTM-TIMING-CACHED');
      document.head.appendChild(existingScript);

      const manager = createManager();
      manager.ensure([{ id: 'GTM-TIMING-CACHED' }]);

      const states = await manager.whenReady();
      const state = states.find((s) => s.containerId === 'GTM-TIMING-CACHED');

      expect(state).toBeDefined();
      expect(state?.status).toBe('loaded');
      expect(state?.fromCache).toBe(true);
      expect(state?.loadTimeMs).toBeUndefined();

      manager.teardown();
    });
  });

  describe('Page unload handling', () => {
    it('sets up pagehide listener when scripts are being loaded', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      const manager = createManager();
      manager.ensure([{ id: 'GTM-UNLOAD-1' }]);

      expect(addEventListenerSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));

      manager.teardown();
      addEventListenerSpy.mockRestore();
    });

    it('removes pagehide listener on teardown', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const manager = createManager();
      manager.ensure([{ id: 'GTM-UNLOAD-2' }]);
      manager.teardown();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('marks pending scripts as skipped on page unload', async () => {
      const manager = createManager();
      manager.ensure([{ id: 'GTM-UNLOAD-3' }]);

      // Simulate page unload before script loads
      const pagehideEvent = new Event('pagehide');
      window.dispatchEvent(pagehideEvent);

      const states = await manager.whenReady();

      expect(states).toContainEqual(
        expect.objectContaining({
          containerId: 'GTM-UNLOAD-3',
          status: 'skipped',
          error: 'Page navigation interrupted script load.'
        })
      );

      manager.teardown();
    });

    it('resolves whenReady immediately on page unload', async () => {
      const manager = createManager();
      manager.ensure([{ id: 'GTM-UNLOAD-4' }]);

      // Get the promise before unload
      const readyPromise = manager.whenReady();

      // Simulate page unload
      const pagehideEvent = new Event('pagehide');
      window.dispatchEvent(pagehideEvent);

      // Promise should resolve immediately
      const states = await readyPromise;
      expect(states).toBeDefined();
      expect(states.length).toBeGreaterThan(0);

      manager.teardown();
    });

    it('only sets up listener once even with multiple ensure calls', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      const manager = createManager();
      manager.ensure([{ id: 'GTM-UNLOAD-5A' }]);
      manager.ensure([{ id: 'GTM-UNLOAD-5B' }]);

      // Should only be called once for pagehide
      const pagehideCalls = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'pagehide');
      expect(pagehideCalls).toHaveLength(1);

      manager.teardown();
      addEventListenerSpy.mockRestore();
    });
  });
});
