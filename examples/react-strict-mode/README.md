# React StrictMode example

This Vite sandbox demonstrates how to wire the `@react-gtm-kit/react-modern` provider inside
`<React.StrictMode>` without duplicating container scripts or data layer pushes. It now mounts a
React Router instance that triggers a `page_view` on each navigation alongside the existing consent
and custom event demos.

## Prerequisites

- Install dependencies from the monorepo root: `pnpm install`
- Build the workspace packages so the example can consume the latest artifacts:
  ```sh
  pnpm build --filter @react-gtm-kit/core --filter @react-gtm-kit/react-modern
  ```

## Running locally

1. From the monorepo root, set the GTM containers you want to load:
   ```sh
   export VITE_GTM_CONTAINERS="GTM-XXXX"
   # Optional overrides:
   # export VITE_GTM_DATALAYER="customDataLayer"
   ```
2. Start the dev server:
   ```sh
   pnpm --filter @react-gtm-kit/example-react-strict-mode dev
   ```
3. Open `http://localhost:5173` and inspect `window.dataLayer` as you interact with the UI.

## Production build

```sh
pnpm --filter @react-gtm-kit/example-react-strict-mode build
pnpm --filter @react-gtm-kit/example-react-strict-mode preview
```

The build step runs `tsc --noEmit` followed by `vite build` to ensure type safety before bundling.
