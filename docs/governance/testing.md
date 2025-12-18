# Testing Guide

This guide covers how to run and write tests for GTM Kit. We aim for <1% bug rate in production through comprehensive testing at every level.

## Quick Start

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @react-gtm-kit/core test

# Run E2E tests
pnpm e2e:test

# Run tests in watch mode (during development)
pnpm --filter @react-gtm-kit/core test -- --watch
```

## Testing Philosophy

GTM Kit follows a testing pyramid approach:

1. **Unit Tests** (80%) - Fast, isolated tests for functions and components
2. **Integration Tests** (15%) - Tests for package interactions
3. **E2E Tests** (5%) - Full browser tests for real user flows

### Key Principles

- **Test behavior, not implementation**: Focus on what the code does, not how
- **Edge cases first**: Consider what can go wrong before happy paths
- **Error messages matter**: Test that helpful errors are thrown
- **Real-world scenarios**: Write tests that mirror actual usage

## Running Tests

### Unit Tests

```bash
# All packages
pnpm test

# Specific package
pnpm --filter @react-gtm-kit/core test
pnpm --filter @react-gtm-kit/react-modern test
pnpm --filter @react-gtm-kit/vue test
pnpm --filter @react-gtm-kit/nuxt test
pnpm --filter @react-gtm-kit/cli test

# With coverage report
pnpm --filter @react-gtm-kit/core test -- --coverage

# Watch mode for development
pnpm --filter @react-gtm-kit/core test -- --watch

# Run specific test file
pnpm --filter @react-gtm-kit/core test -- client.spec.ts
```

### E2E Tests

```bash
# Install Playwright browsers
pnpm e2e:install

# Run all E2E tests
pnpm e2e:test

# Run specific test file
pnpm exec playwright test -c e2e/playwright.config.ts next-app.spec.ts

# Run with headed browser (visible)
pnpm exec playwright test -c e2e/playwright.config.ts --headed

# Debug mode with Playwright Inspector
pnpm exec playwright test -c e2e/playwright.config.ts --debug
```

## Writing Tests

### Unit Test Structure

```typescript
// packages/core/src/__tests__/example.spec.ts
import { createGtmClient } from '../../src';

describe('createGtmClient', () => {
  // Setup/teardown
  beforeEach(() => {
    document.head.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  // Group related tests
  describe('initialization', () => {
    it('initializes data layer on init()', () => {
      const client = createGtmClient({ containers: 'GTM-TEST123' });
      client.init();

      expect((globalThis as any).dataLayer).toBeDefined();
    });

    it('throws when no containers provided', () => {
      expect(() => createGtmClient({ containers: [] }))
        .toThrow(/At least one GTM container/);
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('handles null push values gracefully', () => {
      const client = createGtmClient({ containers: 'GTM-TEST' });
      client.init();

      // Should not throw
      expect(() => client.push(null as any)).not.toThrow();
    });
  });
});
```

### React Component Tests

```typescript
// packages/react-modern/src/__tests__/provider.spec.tsx
import { render, screen } from '@testing-library/react';
import { GtmProvider, useGtmPush } from '../';

describe('GtmProvider', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete (globalThis as any).dataLayer;
  });

  it('provides push function to children', () => {
    const TestComponent = () => {
      const push = useGtmPush();
      return <button onClick={() => push({ event: 'test' })}>Push</button>;
    };

    render(
      <GtmProvider containers="GTM-TEST">
        <TestComponent />
      </GtmProvider>
    );

    screen.getByText('Push').click();
    expect((globalThis as any).dataLayer).toContainEqual(
      expect.objectContaining({ event: 'test' })
    );
  });
});
```

### Vue Component Tests

```typescript
// packages/vue/src/__tests__/plugin.spec.ts
import { mount } from '@vue/test-utils';
import { GtmPlugin, useGtmPush } from '../';

describe('GtmPlugin', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete (globalThis as any).dataLayer;
  });

  it('provides push function to components', () => {
    const TestComponent = {
      setup() {
        const push = useGtmPush();
        return { push };
      },
      template: '<button @click="push({ event: \'test\' })">Push</button>'
    };

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
      }
    });

    wrapper.find('button').trigger('click');
    expect((globalThis as any).dataLayer).toContainEqual(
      expect.objectContaining({ event: 'test' })
    );
  });
});
```

### E2E Tests

```typescript
// e2e/tests/example.spec.ts
import { expect, test, type Page } from '@playwright/test';
import { startServer, type AppServer } from '../apps/example/server';

const getDataLayer = async (page: Page): Promise<unknown[]> => {
  return page.evaluate(() => {
    return (window as any).dataLayer ?? [];
  });
};

test.describe('Example App', () => {
  let server: AppServer;

  test.beforeAll(async () => {
    server = await startServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  test('tracks page views on navigation', async ({ page }) => {
    await page.goto(server.url);

    // Wait for GTM to initialize
    await page.waitForFunction(() => {
      return Array.isArray((window as any).dataLayer);
    });

    // Navigate to another page
    await page.click('text=About');
    await expect(page).toHaveURL(/\/about/);

    // Check page view was tracked
    const dataLayer = await getDataLayer(page);
    expect(dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'page_view',
        page_path: expect.stringContaining('/about')
      })
    );
  });
});
```

## Test Coverage

### Coverage Thresholds

| Package | Statements | Branches | Functions | Lines |
|---------|-----------|----------|-----------|-------|
| core | 80% | 75% | 90% | 80% |
| react-modern | 75% | 65% | 70% | 75% |
| vue | 75% | 65% | 70% | 75% |
| nuxt | 75% | 65% | 70% | 75% |
| cli | 85% | 80% | 85% | 85% |

### Viewing Coverage Reports

```bash
# Generate coverage
pnpm --filter @react-gtm-kit/core test -- --coverage

# Open HTML report
open packages/core/coverage/unit/lcov-report/index.html
```

## What to Test

### Must Test

- **Happy paths**: Normal usage scenarios
- **Error paths**: Invalid inputs, missing dependencies
- **Edge cases**: Empty arrays, null values, special characters
- **Consent flows**: Default, update, region-specific
- **Multi-container**: Multiple GTM containers
- **CSP**: Nonce support, custom hosts

### Test Checklist

```markdown
- [ ] Function returns expected output
- [ ] Function throws on invalid input
- [ ] Error messages are helpful
- [ ] Edge cases handled (null, undefined, empty)
- [ ] Async operations complete correctly
- [ ] Side effects occur (scripts injected, data layer updated)
- [ ] Cleanup works (teardown removes scripts)
- [ ] TypeScript types are correct (tsd tests)
```

## Common Testing Patterns

### Testing Data Layer Updates

```typescript
it('pushes event to data layer', () => {
  const client = createGtmClient({ containers: 'GTM-TEST' });
  client.init();

  client.push({ event: 'test_event', value: 123 });

  const dataLayer = (globalThis as any).dataLayer;
  expect(dataLayer).toContainEqual(
    expect.objectContaining({ event: 'test_event', value: 123 })
  );
});
```

### Testing Script Injection

```typescript
it('injects GTM script', () => {
  const client = createGtmClient({ containers: 'GTM-ABC123' });
  client.init();

  const script = document.querySelector('script[data-gtm-container-id="GTM-ABC123"]');
  expect(script).not.toBeNull();
  expect(script?.getAttribute('src')).toContain('googletagmanager.com/gtm.js');
});
```

### Testing Consent

```typescript
it('applies consent defaults', () => {
  const client = createGtmClient({ containers: 'GTM-TEST' });
  client.setConsentDefaults({ ad_storage: 'denied' });
  client.init();

  const dataLayer = (globalThis as any).dataLayer;
  expect(dataLayer).toContainEqual(
    ['consent', 'default', { ad_storage: 'denied' }]
  );
});
```

### Testing Error Messages

```typescript
it('throws descriptive error for invalid consent value', () => {
  const client = createGtmClient({ containers: 'GTM-TEST' });
  client.init();

  expect(() => {
    client.updateConsent({ ad_storage: 'invalid' as any });
  }).toThrow(/Invalid consent value/);
});
```

## Debugging Tests

### Jest

```bash
# Run with verbose output
pnpm --filter @react-gtm-kit/core test -- --verbose

# Run single test
pnpm --filter @react-gtm-kit/core test -- -t "initializes data layer"

# Debug in VS Code
# Add this to .vscode/launch.json and set breakpoints:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--config", "packages/core/jest.config.cjs"],
  "cwd": "${workspaceFolder}"
}
```

### Playwright

```bash
# Debug with Inspector
pnpm exec playwright test --debug

# Show browser
pnpm exec playwright test --headed

# Generate trace for debugging
pnpm exec playwright test --trace on

# View trace
pnpm exec playwright show-trace e2e/test-results/trace.zip
```

## CI Integration

Tests run automatically on every PR:

1. **Lint**: ESLint + Prettier checks
2. **Type Check**: TypeScript compilation
3. **Unit Tests**: Jest with coverage
4. **E2E Tests**: Playwright in Chromium
5. **Size Check**: Bundle size limits

### Fixing CI Failures

```bash
# Reproduce CI environment locally
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e:test

# Fix lint issues
pnpm format:fix
```

## Adding Tests for New Features

1. **Create test file** in `__tests__` directory
2. **Write failing test** describing expected behavior
3. **Implement feature** to make test pass
4. **Add edge case tests** for error handling
5. **Update coverage thresholds** if needed
6. **Run full test suite** before committing

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
