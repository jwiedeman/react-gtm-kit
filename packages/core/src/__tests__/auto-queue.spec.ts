import { installAutoQueue, createAutoQueueScript, attachToInlineBuffer, cleanupInlineBuffer } from '../auto-queue';
import { createGtmClient } from '../client';

describe('auto-queue', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
    delete (globalThis as Record<string, unknown>).__gtmkit_buffer;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('installAutoQueue', () => {
    it('creates dataLayer if it does not exist', () => {
      installAutoQueue();

      expect((globalThis as Record<string, unknown>).dataLayer).toBeDefined();
      expect(Array.isArray((globalThis as Record<string, unknown>).dataLayer)).toBe(true);
    });

    it('buffers events pushed before GTM loads', () => {
      const state = installAutoQueue();
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      dataLayer.push({ event: 'early_event_1' });
      dataLayer.push({ event: 'early_event_2' });

      expect(state.bufferedCount).toBe(2);
      expect(state.active).toBe(true);
      expect(state.gtmReady).toBe(false);
    });

    it('replays buffered events when gtm.js event is detected', () => {
      const onReplay = jest.fn();
      const state = installAutoQueue({ onReplay });
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // Push some early events
      dataLayer.push({ event: 'early_event_1' });
      dataLayer.push({ event: 'early_event_2' });

      expect(state.bufferedCount).toBe(2);

      // Simulate GTM loading by pushing gtm.js event
      dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

      // Advance timers to trigger the setTimeout in replay
      jest.advanceTimersByTime(10);

      expect(state.active).toBe(false);
      expect(state.gtmReady).toBe(true);
      expect(onReplay).toHaveBeenCalledWith(3); // 2 early events + gtm.js
    });

    it('detects GTM already loaded when installing', () => {
      const dataLayer: unknown[] = [];
      (globalThis as Record<string, unknown>).dataLayer = dataLayer;

      // GTM already loaded before we install
      dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

      const onReplay = jest.fn();
      installAutoQueue({ onReplay });

      jest.advanceTimersByTime(10);

      expect(onReplay).toHaveBeenCalledWith(0);
    });

    it('respects maxBufferSize limit', () => {
      const state = installAutoQueue({ maxBufferSize: 3 });
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      dataLayer.push({ event: 'event_1' });
      dataLayer.push({ event: 'event_2' });
      dataLayer.push({ event: 'event_3' });
      dataLayer.push({ event: 'event_4' }); // Should not be buffered
      dataLayer.push({ event: 'event_5' }); // Should not be buffered

      expect(state.bufferedCount).toBe(3);
    });

    it('calls onTimeout when GTM does not load in time', () => {
      const onTimeout = jest.fn();
      installAutoQueue({ timeout: 1000, onTimeout });
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      dataLayer.push({ event: 'waiting_event' });

      jest.advanceTimersByTime(1001);

      expect(onTimeout).toHaveBeenCalledWith(1);
    });

    it('polls for GTM readiness at configured interval', () => {
      const onReplay = jest.fn();
      installAutoQueue({ pollInterval: 100, onReplay });
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // Push an event
      dataLayer.push({ event: 'early_event' });

      // Manually push gtm.js without triggering the interceptor
      const originalPush = Array.prototype.push.bind(dataLayer);
      originalPush({ 'gtm.start': Date.now(), event: 'gtm.js' });

      // Advance past poll interval
      jest.advanceTimersByTime(150);

      expect(onReplay).toHaveBeenCalled();
    });

    it('allows manual replay', () => {
      const onReplay = jest.fn();
      const state = installAutoQueue({ onReplay });
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      dataLayer.push({ event: 'event_1' });
      dataLayer.push({ event: 'event_2' });

      state.replay();

      expect(state.active).toBe(false);
      expect(onReplay).toHaveBeenCalledWith(2);
    });

    it('allows manual uninstall', () => {
      const state = installAutoQueue();
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      dataLayer.push({ event: 'event_1' });

      state.uninstall();

      expect(state.active).toBe(false);
      expect(state.bufferedCount).toBe(0);
    });

    it('supports custom dataLayer name', () => {
      installAutoQueue({ dataLayerName: 'customLayer' });

      expect((globalThis as Record<string, unknown>).customLayer).toBeDefined();
      expect((globalThis as Record<string, unknown>).dataLayer).toBeUndefined();

      // Cleanup
      delete (globalThis as Record<string, unknown>).customLayer;
    });

    it('preserves existing dataLayer contents', () => {
      const existingLayer = [{ event: 'existing_event' }];
      (globalThis as Record<string, unknown>).dataLayer = existingLayer;

      installAutoQueue();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      expect(dataLayer).toContainEqual({ event: 'existing_event' });
    });

    it('pushes events to actual dataLayer even when buffering', () => {
      installAutoQueue();
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      dataLayer.push({ event: 'buffered_event' });

      // Event should be in both buffer and actual dataLayer
      expect(dataLayer).toContainEqual({ event: 'buffered_event' });
    });
  });

  describe('createAutoQueueScript', () => {
    it('generates valid inline script', () => {
      const script = createAutoQueueScript();

      expect(script).toContain("'dataLayer'");
      expect(script).toContain('__gtmkit_buffer');
    });

    it('supports custom dataLayer name', () => {
      const script = createAutoQueueScript('customLayer');

      expect(script).toContain("'customLayer'");
    });

    it('produces executable script that buffers events', () => {
      const script = createAutoQueueScript();

      // Execute the script
      // eslint-disable-next-line no-eval
      eval(script);

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const buffer = (globalThis as Record<string, unknown>).__gtmkit_buffer as {
        q: { v: unknown; t: number }[];
      };

      expect(dataLayer).toBeDefined();
      expect(buffer).toBeDefined();
      expect(buffer.q).toEqual([]);

      // Push an event
      dataLayer.push({ event: 'inline_event' });

      expect(buffer.q).toHaveLength(1);
      expect(buffer.q[0].v).toEqual({ event: 'inline_event' });
      expect(buffer.q[0].t).toBeGreaterThan(0);
    });

    describe('XSS prevention', () => {
      it('escapes single quotes in dataLayerName', () => {
        const script = createAutoQueueScript("test'injection");

        expect(script).not.toContain("'test'injection'");
        expect(script).toContain("test\\'injection");
      });

      it('escapes double quotes in dataLayerName', () => {
        const script = createAutoQueueScript('test"injection');

        expect(script).not.toContain('"test"injection"');
        expect(script).toContain('test\\"injection');
      });

      it('escapes backslashes in dataLayerName', () => {
        const script = createAutoQueueScript('test\\injection');

        expect(script).toContain('test\\\\injection');
      });

      it('escapes script tags in dataLayerName', () => {
        const script = createAutoQueueScript('test</script><script>alert(1)</script>');

        expect(script).not.toContain('</script>');
        expect(script).toContain('\\x3c/script\\x3e');
      });

      it('escapes newlines in dataLayerName', () => {
        const script = createAutoQueueScript('test\ninjection');

        expect(script).not.toContain('\n');
        expect(script).toContain('test\\ninjection');
      });

      it('escapes carriage returns in dataLayerName', () => {
        const script = createAutoQueueScript('test\rinjection');

        expect(script).not.toContain('\r');
        expect(script).toContain('test\\rinjection');
      });

      it('escapes line separators (U+2028) in dataLayerName', () => {
        const script = createAutoQueueScript('test\u2028injection');

        expect(script).not.toContain('\u2028');
        expect(script).toContain('\\u2028');
      });

      it('escapes paragraph separators (U+2029) in dataLayerName', () => {
        const script = createAutoQueueScript('test\u2029injection');

        expect(script).not.toContain('\u2029');
        expect(script).toContain('\\u2029');
      });

      it('prevents XSS with breakout attempt', () => {
        const malicious = "'); alert('XSS'); //";
        const script = createAutoQueueScript(malicious);

        // The script should NOT contain unescaped single quotes that break out
        expect(script).not.toContain("'); alert('XSS'); //");
        // Should contain properly escaped version
        expect(script).toContain("\\'");
      });

      it('produces safe executable script with malicious input', () => {
        const malicious = "dataLayer'); alert('XSS'); ('";
        const script = createAutoQueueScript(malicious);

        // This should not throw - if XSS was possible, eval would execute alert
        // eslint-disable-next-line no-eval
        expect(() => eval(script)).not.toThrow();

        // Cleanup
        delete (globalThis as Record<string, unknown>)[malicious.replace(/'/g, "\\'")];
      });
    });
  });

  describe('attachToInlineBuffer', () => {
    it('returns null if no inline buffer exists', () => {
      const state = attachToInlineBuffer();

      expect(state).toBeNull();
    });

    it('takes over from inline buffer script', () => {
      // Set up inline buffer as the script would
      const script = createAutoQueueScript();
      // eslint-disable-next-line no-eval
      eval(script);

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      dataLayer.push({ event: 'inline_event' });

      const onReplay = jest.fn();
      const state = attachToInlineBuffer({ onReplay });

      expect(state).not.toBeNull();
      expect(state?.active).toBe(true);

      // Clean up global reference
      expect((globalThis as Record<string, unknown>).__gtmkit_buffer).toBeUndefined();
    });
  });

  describe('integration with createGtmClient', () => {
    it('buffers events before GTM client is created', () => {
      const onReplay = jest.fn();
      installAutoQueue({ onReplay });
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // Events before client exists
      dataLayer.push({ event: 'very_early_event' });

      // Create client
      const client = createGtmClient({ containers: 'GTM-AUTOQUEUE' });

      // More events before init
      client.push({ event: 'pre_init_event' });

      // Initialize client - this pushes gtm.js event
      client.init();

      // Advance timers for replay
      jest.advanceTimersByTime(10);

      // Auto-queue should have detected gtm.js and replayed
      expect(onReplay).toHaveBeenCalled();

      // All events should be in dataLayer
      expect(dataLayer).toContainEqual({ event: 'very_early_event' });
      expect(dataLayer).toContainEqual({ event: 'pre_init_event' });
    });
  });

  describe('cleanupInlineBuffer', () => {
    it('removes __gtmkit_buffer from global scope', () => {
      // Set up inline buffer as the script would
      const script = createAutoQueueScript();
      // eslint-disable-next-line no-eval
      eval(script);

      // Verify buffer was created
      expect((globalThis as Record<string, unknown>).__gtmkit_buffer).toBeDefined();

      // Clean up
      cleanupInlineBuffer();

      // Verify buffer was removed
      expect((globalThis as Record<string, unknown>).__gtmkit_buffer).toBeUndefined();
    });

    it('does nothing if buffer does not exist', () => {
      // Ensure buffer doesn't exist
      delete (globalThis as Record<string, unknown>).__gtmkit_buffer;

      // Should not throw
      expect(() => cleanupInlineBuffer()).not.toThrow();
    });

    it('is called by uninstall()', () => {
      // Set up inline buffer
      const script = createAutoQueueScript();
      // eslint-disable-next-line no-eval
      eval(script);

      // Attach to the buffer
      const state = attachToInlineBuffer();

      // Recreate the buffer (simulating a scenario where it gets recreated)
      (globalThis as Record<string, unknown>).__gtmkit_buffer = { q: [], o: () => 0, n: 'dataLayer' };

      // Uninstall should clean it up
      state?.uninstall();

      expect((globalThis as Record<string, unknown>).__gtmkit_buffer).toBeUndefined();
    });
  });
});
