# Claude Code Instructions for GTM-Kit

## Critical: TODO Tracking

**ALWAYS use `/TODO.md` for task tracking.**

- Never delete items from TODO.md - only move them between sections
- Track all observations, bugs, and improvements there
- Update status after completing work
- Add new items discovered during development

## Project Overview

GTM-Kit is a framework-agnostic Google Tag Manager implementation kit with:

- Core package (`@jwiedeman/gtm-kit`)
- Framework adapters (React, Vue, Svelte, SolidJS, Remix, Astro, Next.js, Nuxt)
- Example apps demonstrating full e-commerce tracking

## Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run E2E tests
pnpm run e2e:test

# Lint
pnpm run lint

# Format
pnpm run format:fix
```

## Example Apps Location

| Framework          | Path                          |
| ------------------ | ----------------------------- |
| Vue 3              | `examples/vue-app/`           |
| React (StrictMode) | `examples/react-strict-mode/` |
| SvelteKit          | `examples/svelte-app/`        |
| SolidJS            | `examples/solid-app/`         |
| Remix              | `examples/remix-app/`         |
| Astro              | `examples/astro-app/`         |
| Vanilla JS         | `examples/vanilla-csr/`       |
| Next.js            | `examples/next-app/`          |
| Nuxt 3             | `examples/nuxt-app/`          |

## E-Commerce Events Standard

All examples should track these GA4 events in order:

1. `view_item_list` - Product list loaded
2. `select_item` - Product clicked
3. `view_item` - Product detail viewed
4. `add_to_cart` - Item added to cart
5. `remove_from_cart` - Item removed from cart
6. `view_cart` - Cart viewed
7. `begin_checkout` - Checkout started
8. `add_shipping_info` - Shipping step completed
9. `add_payment_info` - Payment step completed
10. `purchase` - Transaction completed
11. `refund` - Refund requested

## GA4 Item Schema

```typescript
interface GA4Item {
  item_id: string; // Required
  item_name: string; // Required
  price: number; // Required
  quantity: number; // Required
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  index?: number;
}
```

## Code Standards

- Use TypeScript strict mode
- No `any` types
- Minimize `as unknown as` casts - use type guards instead
- Add error handling around dataLayer operations
- Clean up event listeners on unmount
- Use framework-idiomatic patterns

## Testing

- E2E tests in `e2e/tests/`
- Each example should have tests for full e-commerce flow
- Use modern Playwright locator API (not deprecated `text=` syntax)

## Known Issues

Check `TODO.md` for current issues. Key ones:

- Nuxt build failure (identifier conflict)
- Svelte/SvelteKit version compatibility
- Some E2E tests use deprecated Playwright syntax

## Before Submitting Changes

1. Run `pnpm run build` - all packages must build
2. Run `pnpm run lint` - no lint errors
3. Run `pnpm run e2e:test` - tests should pass
4. Update `TODO.md` with any new observations
5. Verify changes manually in browser
