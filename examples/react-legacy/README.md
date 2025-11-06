# React legacy adapter example

This example showcases the `withGtm` higher-order component from `@react-gtm-kit/react-legacy`. It keeps the
GTM client lifecycle scoped to a class component while exposing push helpers and consent utilities through props.

## Prerequisites

- Install root dependencies: `pnpm install`
- Build the GTM kit packages used by the example:
  ```sh
  pnpm build --filter @react-gtm-kit/core --filter @react-gtm-kit/react-legacy
  ```

## Running locally

1. Configure the containers to load:
   ```sh
   export VITE_GTM_CONTAINERS="GTM-XXXX"
   ```
2. Launch the dev server:
   ```sh
   pnpm --filter @react-gtm-kit/example-react-legacy dev
   ```
3. Open `http://localhost:5174` and check `window.dataLayer` to inspect emitted events.

Optional environment variables:

- `VITE_GTM_DATALAYER` – override the data layer name used by the HOC.

## Production build

```sh
pnpm --filter @react-gtm-kit/example-react-legacy build
pnpm --filter @react-gtm-kit/example-react-legacy preview -- --port 4174
```

The preview command serves the built assets; pass a custom port if 4173/4174 conflict with other examples.
