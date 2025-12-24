# Using the legacy React adapter

The legacy adapter wraps class components and other pre-hooks React code with a higher-order component (HOC) that manages the GTM client lifecycle for you. Install the package alongside the core kit:

```bash
pnpm add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-react-legacy
```

## Wrap a class component

```tsx
import type { LegacyGtmProps } from '@jwiedeman/gtm-kit-react-legacy';
import { withGtm } from '@jwiedeman/gtm-kit-react-legacy';

class LegacyApp extends React.Component<LegacyGtmProps> {
  componentDidMount(): void {
    this.props.gtm.push({ event: 'page_view' });
  }

  render(): JSX.Element {
    return <div>Ready</div>;
  }
}

const GtmEnabledApp = withGtm({
  config: {
    containers: ['GTM-XXXXXXX']
  }
})(LegacyApp);

export default GtmEnabledApp;
```

The injected `gtm` prop exposes the same surface area as the modern adapter hooks:

- `gtm.client` – access to the underlying GTM client instance.
- `gtm.push(value)` – queue data layer pushes that remain safe before or after initialization.
- `gtm.setConsentDefaults(state, options?)` – send Consent Mode defaults.
- `gtm.updateConsent(state, options?)` – send Consent Mode updates.

You can rename the injected prop by providing a `propName` in the options. This is useful when a component already owns a `gtm` prop:

```tsx
const withTracker = withGtm({ config, propName: 'tracker' });
```

## Migrating to the modern adapter

Once your application can adopt hooks (React 16.8+), migrate to the modern provider incrementally:

1. Replace the legacy HOC with the [`GtmProvider`](../../packages/react-modern/src/provider.tsx) at the top of your component tree.
2. Swap `this.props.gtm.push(...)` for the `useGtmPush` hook inside function components.
3. Replace consent helpers with the `useGtmConsent` hook so Suspense and StrictMode flows stay in sync.
4. Remove the legacy adapter once no class components require it; the modern provider handles StrictMode double-mounting and Suspense automatically.

Because both adapters wrap the same core client, you can run them side by side during the migration—each instance creates and tears down its own client without mutating shared global state.
