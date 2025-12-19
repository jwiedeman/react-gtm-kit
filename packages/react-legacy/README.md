# @react-gtm-kit/react-legacy

[![CI](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/react-gtm-kit/graph/badge.svg?flag=react-legacy)](https://codecov.io/gh/jwiedeman/react-gtm-kit)
[![npm version](https://img.shields.io/npm/v/@react-gtm-kit/react-legacy.svg)](https://www.npmjs.com/package/@react-gtm-kit/react-legacy)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@react-gtm-kit/react-legacy)](https://bundlephobia.com/package/@react-gtm-kit/react-legacy)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-16.0+-61DAFB.svg?logo=react)](https://reactjs.org/)

**React Higher-Order Component (HOC) for Google Tag Manager. For class components and pre-hooks React.**

The legacy React adapter for GTM Kit - uses HOC pattern for class component compatibility.

---

## Installation

```bash
npm install @react-gtm-kit/core @react-gtm-kit/react-legacy
```

```bash
yarn add @react-gtm-kit/core @react-gtm-kit/react-legacy
```

```bash
pnpm add @react-gtm-kit/core @react-gtm-kit/react-legacy
```

---

## When to Use This Package

Use `@react-gtm-kit/react-legacy` if:

- You're using class components
- Your project uses React < 16.8 (no hooks)
- You prefer the HOC pattern
- You're maintaining a legacy codebase

**For new projects**, we recommend [`@react-gtm-kit/react-modern`](https://www.npmjs.com/package/@react-gtm-kit/react-modern) which uses hooks.

---

## Quick Start

### Step 1: Wrap Your App

```tsx
import { withGtm } from '@react-gtm-kit/react-legacy';

class App extends React.Component {
  render() {
    return <YourApp />;
  }
}

export default withGtm(App, { containers: 'GTM-XXXXXX' });
```

### Step 2: Push Events

```tsx
import { withGtmPush } from '@react-gtm-kit/react-legacy';

class BuyButton extends React.Component {
  handleClick = () => {
    this.props.gtmPush({ event: 'purchase', value: 49.99 });
  };

  render() {
    return <button onClick={this.handleClick}>Buy Now</button>;
  }
}

export default withGtmPush(BuyButton);
```

---

## Features

| Feature | Description |
|---------|-------------|
| **HOC Pattern** | Works with class components |
| **React 16.0+** | Compatible with older React versions |
| **StrictMode-Safe** | No double-fires in development mode |
| **TypeScript** | Full type definitions included |
| **Consent Mode v2** | Built-in GDPR compliance support |

---

## Available HOCs

### `withGtm(Component, config)`

Wraps your root component and initializes GTM.

```tsx
import { withGtm } from '@react-gtm-kit/react-legacy';

class App extends React.Component {
  render() {
    return <div>{this.props.children}</div>;
  }
}

export default withGtm(App, {
  containers: 'GTM-XXXXXX',
  dataLayerName: 'dataLayer', // optional
  onBeforeInit: (client) => {
    // Set consent defaults here
  }
});
```

### `withGtmPush(Component)`

Injects a `gtmPush` prop for pushing events.

```tsx
import { withGtmPush } from '@react-gtm-kit/react-legacy';

class TrackableButton extends React.Component {
  handleClick = () => {
    this.props.gtmPush({ event: 'button_click', button_id: 'main-cta' });
  };

  render() {
    return <button onClick={this.handleClick}>Click Me</button>;
  }
}

export default withGtmPush(TrackableButton);
```

### `withGtmConsent(Component)`

Injects consent management props.

```tsx
import { withGtmConsent } from '@react-gtm-kit/react-legacy';

class CookieBanner extends React.Component {
  acceptAll = () => {
    this.props.updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  };

  render() {
    return <button onClick={this.acceptAll}>Accept All</button>;
  }
}

export default withGtmConsent(CookieBanner);
```

### `withGtmClient(Component)`

Injects the raw GTM client instance.

```tsx
import { withGtmClient } from '@react-gtm-kit/react-legacy';

class AdvancedComponent extends React.Component {
  componentDidMount() {
    this.props.gtmClient.whenReady().then(() => {
      console.log('GTM is ready!');
    });
  }

  render() {
    return <div>Advanced GTM usage</div>;
  }
}

export default withGtmClient(AdvancedComponent);
```

---

## Consent Mode v2 (GDPR)

```tsx
import { withGtm, withGtmConsent } from '@react-gtm-kit/react-legacy';
import { consentPresets } from '@react-gtm-kit/core';

// Root component with consent defaults
class App extends React.Component {
  render() {
    return <div>{this.props.children}</div>;
  }
}

export default withGtm(App, {
  containers: 'GTM-XXXXXX',
  onBeforeInit: (client) => {
    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
  }
});

// Cookie banner component
class CookieBanner extends React.Component {
  render() {
    return (
      <div>
        <button onClick={() => this.props.updateConsent({ analytics_storage: 'granted' })}>
          Accept Analytics
        </button>
      </div>
    );
  }
}

export default withGtmConsent(CookieBanner);
```

---

## Migrating to react-modern

If you're upgrading your codebase to use hooks, migration is straightforward:

```tsx
// Before (react-legacy)
class Button extends React.Component {
  render() {
    return <button onClick={() => this.props.gtmPush({ event: 'click' })}>Click</button>;
  }
}
export default withGtmPush(Button);

// After (react-modern)
function Button() {
  const push = useGtmPush();
  return <button onClick={() => push({ event: 'click' })}>Click</button>;
}
```

---

## Requirements

- React 16.0+
- `@react-gtm-kit/core` (peer dependency)

---

## License

MIT
