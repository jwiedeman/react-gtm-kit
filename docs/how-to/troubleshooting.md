# Troubleshooting & FAQ

Diagnose common GTM integration issues when adopting React GTM Kit. Start with the
symptom, confirm the likely cause, and apply the recommended fix.

## Duplicate containers or scripts

**Symptoms**

- Duplicate page_view events or consent updates firing twice.
- Multiple `<script src="https://www.googletagmanager.com/gtm.js">` tags in the DOM.

**Likely causes**

- The core client is initialized more than once because the init call lives in a component
  that re-renders on navigation.
- Multiple containers share the same ID but are passed separately instead of as a single
  array to `createGtmClient`.

**Resolution**

- Ensure the init call executes in a top-level singleton (e.g., React provider, layout).
- Use the React adapters which handle StrictMode re-mounts and guard against duplicate
  script injection.
- When loading multiple containers intentionally, pass their IDs as one array to reuse
  the shared script manager.

## Missing data layer entries

**Symptoms**

- `window.dataLayer` is `undefined` in the console.
- GTM preview mode shows no received events.

**Likely causes**

- Custom data layer name configured in `createGtmClient` but the page still pushes to
  the default `dataLayer`.
- Third-party code replaced the global data layer array instead of pushing onto it.

**Resolution**

- When using a non-default name, update all pushes to call `client.push` or use the
  `dataLayerName` you configured.
- Call `ensureDataLayer` before third-party scripts mutate the global scope so the
  React GTM Kit client remains the owner of the array reference.
- Use the logger (`createConsoleLogger`) during development to confirm pushes reach the
  expected layer.

## Consent state not updating

**Symptoms**

- Consent banner buttons appear to work but preview mode never shows `consent` events.
- Consent cookies remain unchanged after interaction.

**Likely causes**

- Consent update buttons push the wrong key (`analyticsStorage` instead of
  `analytics_storage`).
- Consent updates run before the client initializes and the queue never flushes.

**Resolution**

- Use the `setConsent` helpers from `@react-gtm-kit/core` or the React adapters to
  ensure canonical key casing and queue flushing.
- Confirm the consent handler executes after the provider mounts. In React, wrap
  consent updates in `useEffect` hooks rather than calling them during render.
- Verify that your CMP allows the script to run (no blocked GTM host).

## SPA navigations missing page views

**Symptoms**

- Only the initial page load appears in analytics.
- Playwright smoke tests capture pageviews for some routes but not others.

**Likely causes**

- Navigation listeners fire before the React GTM Kit hooks initialize.
- Router emits hash-based changes that are ignored by your handler.

**Resolution**

- Use the React Router and Next.js helpers that ship with the project; they guard
  against early navigation events and deduplicate transitions.
- In custom setups, debounce navigation listeners and call `pushEvent` after the router
  confirms the final path.
- For hash-based routing, include the hash in your page path (`window.location.hash`).

## Frequently asked questions

### How do I inspect the data layer quickly?

Use the development logger or run the example smoke scripts (`pnpm examples:smoke`).
They output data layer snapshots for each scenario so you can diff changes safely.

### GTM preview works locally but fails in production. What should I check?

- Confirm environment parameters (`gtm_auth`, `gtm_preview`) are wired through your
  deployment pipeline.
- Ensure CSP headers include the nonce if you inject one with the script manager.
- Double-check that the production build does not strip the noscript iframe when using
  SSR frameworks.

### Can I reset GTM between tests?

Yes. Call the teardown helper returned by `createGtmClient` to remove injected scripts
and restore the global data layer. The Playwright suites exercise this flow for end-to-end
coverage.
