# Debug GTM integrations

Use these steps to troubleshoot data layer and container issues when working with React
GTM Kit.

## Validate initialization

- Enable the optional logger when creating the client to emit lifecycle messages
  (e.g., `createGtmClient({ containers: 'GTM-XXXX', logger: console })`).
- Confirm only one container script per ID exists in the DOM by inspecting `<script>`
  elements marked with `data-gtm-container`.
- Verify the `dataLayer` array includes the `gtm.start` event and your queued pushes.

## Inspect consent behavior

- Check the consent state by reading `window.dataLayer` entries for `consent` updates.
- Ensure Consent Mode keys match Google documentation (`ad_storage`, `analytics_storage`,
  `ad_user_data`, `ad_personalization`).
- If tags do not fire, confirm your CMP is triggering `updateConsent` with `granted`
  states where appropriate.

## Network diagnostics

- Use browser devtools to ensure requests hit `https://www.googletagmanager.com/gtm.js`
  or your configured server-side tagging host.
- Look for blocked requests caused by CSP violations; missing nonce attributes usually
  indicate a mismatch between server and client configuration.

## Resetting state during development

- Call the teardown helper before hot reloading or when running tests to remove injected
  scripts.
- In React StrictMode, ensure your provider lives at the top of the tree so duplicate
  mounts do not create multiple data layers.
