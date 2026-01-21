# GTM-Kit Performance Characteristics

This document details the performance characteristics, optimizations, and best practices for GTM-Kit.

---

## Table of Contents

- [Bundle Sizes](#bundle-sizes)
- [Runtime Performance](#runtime-performance)
- [Memory Management](#memory-management)
- [Optimization Strategies](#optimization-strategies)
- [Benchmarks](#benchmarks)

---

## Bundle Sizes

All packages are optimized for minimal bundle impact. Sizes are measured with gzip compression.

### Package Sizes (gzip)

| Package                           | Size     | Limit  | Notes                   |
| --------------------------------- | -------- | ------ | ----------------------- |
| `@jwiedeman/gtm-kit` (core)       | ~3.6 KB  | 4 KB   | Zero dependencies       |
| `@jwiedeman/gtm-kit-react`        | ~6.8 KB  | 7.5 KB | Includes core           |
| `@jwiedeman/gtm-kit-react-legacy` | ~6.8 KB  | 7.5 KB | Class component support |
| `@jwiedeman/gtm-kit-vue`          | ~3.9 KB  | 4.5 KB | Vue 3 only              |
| `@jwiedeman/gtm-kit-solid`        | ~7.5 KB  | 8 KB   | SolidJS signals         |
| `@jwiedeman/gtm-kit-svelte`       | ~5.3 KB  | 6 KB   | Svelte stores           |
| `@jwiedeman/gtm-kit-remix`        | ~6.9 KB  | 7.5 KB | Remix routing           |
| `@jwiedeman/gtm-kit-next`         | ~13.8 KB | 15 KB  | App Router support      |
| `@jwiedeman/gtm-kit-nuxt`         | ~8.1 KB  | 9 KB   | Nuxt 3 module           |
| `@jwiedeman/gtm-kit-astro`        | ~3.7 KB  | 6 KB   | Static + hydration      |

### Tree-Shaking

All packages support tree-shaking with `"sideEffects": false` in package.json.

**Tree-Shaking Results (esbuild analysis):**

```
Full import:     ~4.2 KB
createGtmClient only: ~3.2 KB (24% reduction)
Events only:     ~0.5 KB
Consent presets: ~0.5 KB
Noscript utils:  ~1.2 KB
```

### Importing Best Practices

```typescript
// ✅ Good - Only import what you need
import { createGtmClient, pushEvent } from '@jwiedeman/gtm-kit';

// ✅ Good - Named imports enable tree-shaking
import { useGtm, useGtmPush } from '@jwiedeman/gtm-kit-react';

// ❌ Avoid - Imports everything
import * as gtmKit from '@jwiedeman/gtm-kit';
```

---

## Runtime Performance

### DataLayer Push Performance

| Operation         | Average Time | Notes                      |
| ----------------- | ------------ | -------------------------- |
| Simple event push | < 0.1ms      | `{ event: 'click' }`       |
| E-commerce push   | < 0.5ms      | With 10 items              |
| Large e-commerce  | < 2ms        | With 100+ items            |
| Consent command   | < 0.3ms      | With signature computation |

### Script Loading

| Metric             | Typical Value | Factors               |
| ------------------ | ------------- | --------------------- |
| Script load time   | 50-200ms      | Network, caching, CDN |
| GTM initialization | 10-50ms       | Container complexity  |
| Total ready time   | 100-500ms     | Network + init        |

### Memory Overhead

| Component             | Memory Usage | Notes                   |
| --------------------- | ------------ | ----------------------- |
| Client instance       | ~2-5 KB      | Per container           |
| DataLayer (empty)     | ~1 KB        | Array overhead          |
| DataLayer (500 items) | ~50-200 KB   | Depends on payload size |
| Signature cache       | Variable     | WeakMap, auto-cleaned   |

---

## Memory Management

### DataLayer Size Limiting

GTM-Kit automatically manages dataLayer size to prevent memory issues:

```typescript
createGtmClient({
  containers: 'GTM-XXXXXX',
  maxDataLayerSize: 500, // Default limit
  onDataLayerTrim: (trimmedCount) => {
    console.log(`Trimmed ${trimmedCount} old entries`);
  }
});
```

**How it works:**

1. When dataLayer exceeds `maxDataLayerSize`, oldest entries are removed
2. GTM-Kit preserves the most recent entries
3. Callback notifies when trimming occurs

### WeakMap Caching

Consent command signatures use WeakMap caching to:

- Prevent redundant serialization of the same objects
- Automatically clean up when objects are garbage collected
- Eliminate memory leaks from long-running sessions

```typescript
// Internal implementation (simplified)
const signatureCache = new WeakMap<object, string>();

function getSignature(obj: object): string {
  if (signatureCache.has(obj)) {
    return signatureCache.get(obj)!;
  }
  const signature = computeSignature(obj);
  signatureCache.set(obj, signature);
  return signature;
}
```

### Cleanup on Teardown

All adapters properly clean up resources:

```typescript
// React
useEffect(() => {
  return () => {
    client.teardown(); // Cleans up listeners, timers, references
  };
}, []);

// Vue
app.unmount(); // Plugin auto-teardown

// Svelte
onDestroy(() => {
  destroyGtmStore(gtmStore);
});
```

---

## Optimization Strategies

### 1. Consent Deduplication

GTM-Kit prevents duplicate consent commands using signature-based deduplication:

```typescript
// These will only push ONE command (duplicates detected)
client.updateConsent({ analytics_storage: 'granted' });
client.updateConsent({ analytics_storage: 'granted' }); // Skipped
client.updateConsent({ analytics_storage: 'granted' }); // Skipped
```

**Benefits:**

- Reduces unnecessary dataLayer entries
- Prevents GTM from processing identical commands
- Works across multiple rapid calls

### 2. Script Loading Optimization

**Async Loading:**
GTM scripts load asynchronously and don't block page rendering.

**Retry with Exponential Backoff:**

```typescript
createGtmClient({
  containers: 'GTM-XXXXXX',
  retry: {
    attempts: 3,
    delay: 1000, // Start at 1s
    maxDelay: 30000 // Cap at 30s
  }
});
```

Retry schedule: 1s → 2s → 4s (capped at maxDelay)

**Script Timeout:**

```typescript
createGtmClient({
  containers: 'GTM-XXXXXX',
  scriptTimeout: 30000, // 30 seconds (default)
  onScriptTimeout: (containerId) => {
    // Handle timeout gracefully
  }
});
```

### 3. SSR/Hydration Optimization

**Snapshot Mechanism:**
GTM-Kit snapshots the dataLayer before hydration to prevent duplicate events:

```typescript
// Server: Renders GTM scripts
<GtmHeadScript containers="GTM-XXXXXX" />

// Client: Detects existing gtm.js event
// Skips re-initialization, preserves server-pushed events
```

**Hydration Safety:**

```tsx
// React
const hydrated = useHydrated();

if (hydrated) {
  // Safe to push client-only events
  push({ event: 'client_ready' });
}
```

### 4. Batch Operations

For high-frequency events, consider batching:

```typescript
// ❌ Inefficient - Many small pushes
items.forEach((item) => {
  pushEvent(client, 'item_view', { item_id: item.id });
});

// ✅ Better - Single push with array
pushEvent(client, 'items_viewed', {
  items: items.map((i) => ({ item_id: i.id }))
});
```

### 5. Debug Mode in Development Only

```typescript
createGtmClient({
  containers: 'GTM-XXXXXX',
  debug: process.env.NODE_ENV === 'development'
});
```

Debug mode adds logging overhead - disable in production.

---

## Benchmarks

### Event Push Throughput

Test: Push 5,000 events sequentially

```
Regular events (no signature): < 5 seconds
Consent commands (with signature): < 3 seconds for 500 commands
```

### Memory Stability

Test: 10,000 operations over simulated long session

```
Initial heap: ~5 MB
After 10K ops: ~8 MB
After GC: ~6 MB
Memory growth: ~20% (within acceptable range)
```

### Stress Test Results

Test: 150 GA4 e-commerce items in single push

```
Serialization time: < 50ms
Push completion: < 100ms
Memory impact: < 500 KB
```

Test: 1,200 events simulating real user session

```
Total time: < 30 seconds
Memory stable: Yes
No performance degradation: Confirmed
```

---

## Best Practices Summary

### Do's

1. **Use tree-shaking** - Import only what you need
2. **Set reasonable dataLayer limits** - Default 500 is good for most apps
3. **Use consent deduplication** - Let GTM-Kit handle duplicate prevention
4. **Clean up on unmount** - Call teardown in cleanup functions
5. **Use debug mode wisely** - Development only
6. **Batch high-frequency events** - Reduce individual pushes

### Don'ts

1. **Don't push in tight loops** - Batch operations instead
2. **Don't store large objects** - Keep event payloads lean
3. **Don't disable size limits** - Risk memory issues
4. **Don't skip cleanup** - Memory leaks in SPAs
5. **Don't use debug in production** - Performance overhead

---

## Monitoring Performance

### Built-in Diagnostics

```typescript
const diagnostics = client.getDiagnostics();

console.log({
  dataLayerSize: diagnostics.dataLayerSize,
  queueSize: diagnostics.queueSize,
  uptimeMs: diagnostics.uptimeMs,
  ready: diagnostics.ready
});
```

### Performance Timing

```typescript
// Measure script load time
client.whenReady().then((states) => {
  states.forEach((state) => {
    console.log(`${state.containerId}: ${state.loadTimeMs}ms`);
  });
});
```

### Memory Monitoring (Development)

```typescript
// Check memory usage periodically
setInterval(() => {
  if (typeof performance !== 'undefined' && performance.memory) {
    console.log('Heap used:', performance.memory.usedJSHeapSize / 1024 / 1024, 'MB');
  }
}, 10000);
```

---

## Framework-Specific Considerations

### React

- Use `useMemo` for stable callback references
- Avoid creating new objects in render
- Use `useCallback` for event handlers

### Vue

- Consent API is pre-memoized
- Use `computed` for derived tracking data
- Avoid reactive wrappers on large objects

### SolidJS

- Signals are already optimized
- No additional memoization needed
- Fine-grained reactivity is efficient

### Svelte

- Stores are reactive by default
- Use derived stores for computed values
- Clean up in `onDestroy`

---

_Benchmarks performed on Node.js 18 LTS, Apple M1, 16GB RAM_
_Real-world performance may vary based on browser, network, and device_
