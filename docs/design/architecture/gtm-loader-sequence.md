# GTM loader lifecycle (sequence)

```mermaid
sequenceDiagram
  autonumber
  participant App as Application
  participant Client as GtmClient
  participant DL as dataLayer
  participant ScriptManager as Script manager
  participant DOM as Document

  App->>Client: createGtmClient(options)
  Client->>DL: ensureDataLayer(name)
  Client->>Client: captureSnapshotSignatures()
  App->>Client: init()
  Client->>DL: push({ event: 'gtm.js', 'gtm.start': timestamp })
  Client->>Client: flushQueue()
  Client->>ScriptManager: ensure(containers, scriptAttributes)
  ScriptManager->>DOM: insert <script data-gtm-container-id>
  DOM-->>ScriptManager: load event
  ScriptManager-->>Client: notifyLoaded(containerId)
  Client->>DL: replay queued pushes
  App->>Client: push(dataLayerValue)
  Client->>DL: append value (if initialized)
  App->>Client: teardown()
  Client->>ScriptManager: remove(containerId)
  Client->>DL: restore snapshot
```

**Key takeaways**

- The GTM client captures the initial `dataLayer` contents before mutating them so teardown can restore the original state.
- Script deduplication is owned by the `ScriptManager`, which tags every injected `<script>` with a deterministic `data-gtm-container-id` attribute.
- Queue flushing happens immediately after initialization. Any pushes issued before `init()` are replayed in FIFO order using the captured queue.
- Teardown removes injected scripts and replays the captured snapshot so tests and microfrontends can reclaim the global state cleanly.
