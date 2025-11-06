# SSR strategy

Server-side rendering introduces CSP and hydration nuances for GTM. This guide outlines
how the kit keeps SSR flows predictable.

## Server responsibilities

- Render the noscript iframe using `createNoscriptMarkup` near the top of the `<body>`
  for JS-disabled scenarios.
- Generate or read a CSP nonce and pass it into the loader so injected scripts carry
  the expected attributes.
- Serialize any initial data layer state into the HTML payload while avoiding duplicate
  pushes on the client.

## Client responsibilities

- Call `initGtm` inside a client-only boundary (e.g., Next.js `useEffect` or a React
  provider) so the container loads once after hydration.
- Hydrate with the same data layer name used on the server. The core utilities detect
  existing arrays and reuse them.
- Reconcile consent defaults during hydration by reading persisted consent and passing
  it into `initGtm`.

## CSP considerations

- Include the nonce attribute on both the inline bootstrap snippet and the dynamically
  injected GTM script tags.
- Audit third-party script policies; GTM loads from `https://www.googletagmanager.com` by
  default unless you specify a custom host for server-side tagging.

## Testing recommendations

- Use the provided Playwright scenarios (see `e2e/`) to validate CSP + noscript behavior
  in CI.
- For custom SSR stacks, create an integration test that renders the server output,
  hydrates the client, and asserts that duplicate scripts are not injected.
