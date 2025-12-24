# @jwiedeman/gtm-kit-react-legacy

[![CI](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/GTM-Kit/graph/badge.svg?flag=react-legacy)](https://codecov.io/gh/jwiedeman/GTM-Kit)
[![npm version](https://img.shields.io/npm/v/@jwiedeman/gtm-kit-react-legacy.svg)](https://www.npmjs.com/package/@jwiedeman/gtm-kit-react-legacy)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jwiedeman/gtm-kit-react-legacy)](https://bundlephobia.com/package/@jwiedeman/gtm-kit-react-legacy)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-16.0+-61DAFB.svg?logo=react)](https://reactjs.org/)

**React Higher-Order Component (HOC) for Google Tag Manager. For class components and pre-hooks React.**

The legacy React adapter for GTM Kit - uses HOC pattern for class component compatibility.

---

## Installation

```bash
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-react-legacy
```

```bash
yarn add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-react-legacy
```

```bash
pnpm add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-react-legacy
```

---

## When to Use This Package

Use `@jwiedeman/gtm-kit-react-legacy` if:

- You're using class components
- Your project uses React < 16.8 (no hooks)
- You prefer the HOC pattern
- You're maintaining a legacy codebase

**For new projects**, we recommend [`@jwiedeman/gtm-kit-react`](https://www.npmjs.com/package/@jwiedeman/gtm-kit-react) which uses hooks.

---

## Quick Start

### Step 1: Wrap Your Root Component

```tsx
import React from 'react';
import { withGtm } from '@jwiedeman/gtm-kit-react-legacy';

class App extends React.Component {
  render() {
    return <YourApp />;
  }
}

// Wrap with GTM - note the curried function pattern
export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(App);
```

### Step 2: Use the GTM API in Child Components

The `withGtm` HOC injects a `gtm` prop with the full GTM API:

```tsx
import React from 'react';
import { withGtm } from '@jwiedeman/gtm-kit-react-legacy';

class BuyButton extends React.Component {
  handleClick = () => {
    // Access push via the injected gtm prop
    this.props.gtm.push({ event: 'purchase', value: 49.99 });
  };

  render() {
    return <button onClick={this.handleClick}>Buy Now</button>;
  }
}

// Wrap any component to get the gtm prop
export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(BuyButton);
```

---

## Features

| Feature             | Description                          |
| ------------------- | ------------------------------------ |
| **HOC Pattern**     | Works with class components          |
| **React 16.0+**     | Compatible with older React versions |
| **StrictMode-Safe** | No double-fires in development mode  |
| **TypeScript**      | Full type definitions included       |
| **Consent Mode v2** | Built-in GDPR compliance support     |

---

## API Reference

### `withGtm(options)(Component)`

A curried Higher-Order Component that wraps your component and provides GTM functionality.

```tsx
import { withGtm } from '@jwiedeman/gtm-kit-react-legacy';

const WrappedComponent = withGtm({
  config: {
    containers: 'GTM-XXXXXX',
    dataLayerName: 'dataLayer' // optional
  },
  propName: 'gtm' // optional, defaults to 'gtm'
})(YourComponent);
```

#### Options

| Option     | Type                     | Default  | Description               |
| ---------- | ------------------------ | -------- | ------------------------- |
| `config`   | `CreateGtmClientOptions` | Required | GTM client configuration  |
| `propName` | `string`                 | `'gtm'`  | Name of the injected prop |

#### Injected Props

The wrapped component receives a prop (default name: `gtm`) with the following API:

```typescript
interface LegacyGtmApi {
  client: GtmClient; // Raw GTM client
  push: (value: DataLayerValue) => void; // Push to dataLayer
  setConsentDefaults: (state, options?) => void; // Set consent defaults
  updateConsent: (state, options?) => void; // Update consent state
}
```

---

## Usage Examples

### Pushing Events

```tsx
class TrackableButton extends React.Component {
  handleClick = () => {
    this.props.gtm.push({
      event: 'button_click',
      button_id: 'main-cta',
      button_text: 'Sign Up'
    });
  };

  render() {
    return <button onClick={this.handleClick}>Sign Up</button>;
  }
}

export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(TrackableButton);
```

### E-commerce Tracking

```tsx
class ProductCard extends React.Component {
  trackAddToCart = () => {
    this.props.gtm.push({
      event: 'add_to_cart',
      ecommerce: {
        items: [
          {
            item_id: this.props.product.id,
            item_name: this.props.product.name,
            price: this.props.product.price
          }
        ]
      }
    });
  };

  render() {
    return (
      <div>
        <h3>{this.props.product.name}</h3>
        <button onClick={this.trackAddToCart}>Add to Cart</button>
      </div>
    );
  }
}

export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(ProductCard);
```

### Managing Consent

```tsx
class CookieBanner extends React.Component {
  acceptAll = () => {
    this.props.gtm.updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  };

  acceptAnalyticsOnly = () => {
    this.props.gtm.updateConsent({
      analytics_storage: 'granted'
    });
  };

  render() {
    return (
      <div className="cookie-banner">
        <p>We use cookies to improve your experience.</p>
        <button onClick={this.acceptAnalyticsOnly}>Analytics Only</button>
        <button onClick={this.acceptAll}>Accept All</button>
      </div>
    );
  }
}

export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(CookieBanner);
```

### Setting Consent Defaults

```tsx
class App extends React.Component {
  componentDidMount() {
    // Set consent defaults for EEA users
    this.props.gtm.setConsentDefaults(
      {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      },
      { region: ['EEA'] }
    );
  }

  render() {
    return <YourApp />;
  }
}

export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(App);
```

### Custom Prop Name

```tsx
// Use a custom prop name instead of 'gtm'
class MyComponent extends React.Component {
  handleClick = () => {
    this.props.analytics.push({ event: 'click' });
  };

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}

export default withGtm({
  config: { containers: 'GTM-XXXXXX' },
  propName: 'analytics'
})(MyComponent);
```

### Accessing the Raw Client

```tsx
class AdvancedComponent extends React.Component {
  componentDidMount() {
    // Wait for GTM to be fully loaded
    this.props.gtm.client.whenReady().then(() => {
      console.log('GTM is ready!');
    });
  }

  render() {
    return <div>Advanced GTM usage</div>;
  }
}

export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(AdvancedComponent);
```

---

## TypeScript Support

Full TypeScript definitions are included:

```tsx
import React from 'react';
import { withGtm, LegacyGtmProps } from '@jwiedeman/gtm-kit-react-legacy';

interface MyComponentProps extends LegacyGtmProps {
  title: string;
}

class MyComponent extends React.Component<MyComponentProps> {
  handleClick = () => {
    // TypeScript knows gtm.push exists
    this.props.gtm.push({ event: 'click' });
  };

  render() {
    return <h1 onClick={this.handleClick}>{this.props.title}</h1>;
  }
}

export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(MyComponent);
```

---

## Migrating to react-modern

If you're upgrading your codebase to use hooks, migration is straightforward:

```tsx
// Before (react-legacy)
import { withGtm } from '@jwiedeman/gtm-kit-react-legacy';

class Button extends React.Component {
  render() {
    return <button onClick={() => this.props.gtm.push({ event: 'click' })}>Click</button>;
  }
}
export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(Button);

// After (react-modern)
import { useGtmPush } from '@jwiedeman/gtm-kit-react';

function Button() {
  const push = useGtmPush();
  return <button onClick={() => push({ event: 'click' })}>Click</button>;
}
```

---

## Requirements

- React 16.0+
- `@jwiedeman/gtm-kit` (peer dependency)

---

## Related Packages

- **Core**: [@jwiedeman/gtm-kit](https://www.npmjs.com/package/@jwiedeman/gtm-kit) (required)
- **Modern React**: [@jwiedeman/gtm-kit-react](https://www.npmjs.com/package/@jwiedeman/gtm-kit-react) (recommended for new projects with hooks)

---

## Support

**Have a question, found a bug, or need help?**

[Open an issue on GitHub](https://github.com/jwiedeman/GTM-Kit/issues) — we're actively maintaining this project and respond quickly.

---

## License

MIT
