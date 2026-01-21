# Defensive Coding & Accessibility Patterns

This guide covers defensive coding and accessibility best practices for GTM-Kit implementations, using the Vue example app as a reference.

---

## Table of Contents

- [Debouncing Event Tracking](#debouncing-event-tracking)
- [Loading States](#loading-states)
- [Double-Click Prevention](#double-click-prevention)
- [Cart Validation](#cart-validation)
- [Accessibility for E-Commerce](#accessibility-for-e-commerce)
- [Implementation Examples](#implementation-examples)

---

## Debouncing Event Tracking

### The Problem

Without debouncing, rapid clicks on "Add to Cart" can:

- Fire multiple `add_to_cart` events
- Create duplicate cart entries
- Cause race conditions in state updates
- Inflate analytics data

### Solution: Simple Debounce Utility

```typescript
// Create a debounce utility for action management
const createDebounce = () => {
  const pendingActions = new Set<string>();

  return {
    /**
     * Execute an action with debouncing
     * @param key - Unique identifier for this action (e.g., product ID)
     * @param action - The function to execute
     * @param delayMs - Debounce delay in milliseconds
     */
    execute: async (key: string, action: () => void | Promise<void>, delayMs = 300) => {
      if (pendingActions.has(key)) {
        return; // Skip if action already pending
      }
      pendingActions.add(key);
      try {
        await action();
      } finally {
        setTimeout(() => {
          pendingActions.delete(key);
        }, delayMs);
      }
    },
    isPending: (key: string) => pendingActions.has(key)
  };
};
```

### Usage in Add to Cart

```typescript
const debounce = createDebounce();

const addToCart = (product: Product) => {
  debounce.execute(
    `add-${product.id}`,
    () => {
      // Cart update logic
      cart.push({ ...product, quantity: 1 });

      // Track event (only fires once per debounce period)
      pushEcommerce(client, 'add_to_cart', {
        currency: 'USD',
        value: product.price,
        items: [toGA4Item(product)]
      });
    },
    500
  ); // 500ms debounce
};
```

---

## Loading States

### The Problem

Without loading states:

- Users don't know if their action is being processed
- Users may click multiple times thinking it didn't work
- No visual feedback leads to poor UX

### Solution: Reactive Loading States

```typescript
// Vue 3 Composition API
const isAddingToCart = ref<Set<string>>(new Set());
const isProcessingPayment = ref(false);

const addToCart = (product: Product) => {
  isAddingToCart.value.add(product.id);

  try {
    // ... add to cart logic
  } finally {
    setTimeout(() => {
      isAddingToCart.value.delete(product.id);
    }, 200); // Brief delay for visual feedback
  }
};

// Helper for templates
const isAddingProduct = (productId: string) => isAddingToCart.value.has(productId);
```

### Template with Loading State

```vue
<button
  type="button"
  :disabled="isAddingProduct(product.id)"
  :aria-busy="isAddingProduct(product.id)"
  @click="addToCart(product)"
>
  {{ isAddingProduct(product.id) ? 'Adding...' : 'Add to Cart' }}
</button>
```

### React Implementation

```tsx
const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());

const addToCart = async (product: Product) => {
  setLoadingProducts(prev => new Set(prev).add(product.id));

  try {
    // ... add to cart logic
    pushEcommerce(client, 'add_to_cart', { ... });
  } finally {
    setTimeout(() => {
      setLoadingProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 200);
  }
};

// In JSX
<button
  disabled={loadingProducts.has(product.id)}
  aria-busy={loadingProducts.has(product.id)}
  onClick={() => addToCart(product)}
>
  {loadingProducts.has(product.id) ? 'Adding...' : 'Add to Cart'}
</button>
```

---

## Double-Click Prevention

### The Problem

Purchase buttons without protection can:

- Create duplicate orders
- Fire multiple `purchase` events
- Cause inventory issues
- Lead to customer support headaches

### Solution: Payment Processing Lock

```typescript
const isProcessingPayment = ref(false);

const completePurchase = () => {
  // Prevent double submission
  if (isProcessingPayment.value) {
    console.warn('Payment already in progress');
    return;
  }

  isProcessingPayment.value = true;

  try {
    // Process payment
    pushEcommerce(client, 'purchase', {
      transaction_id: generateTransactionId()
      // ... other fields
    });
  } catch (error) {
    console.error('Purchase failed:', error);
  } finally {
    // Reset after completion or error
    isProcessingPayment.value = false;
  }
};
```

### Template with Disabled State

```vue
<button
  type="button"
  class="pay-btn"
  :disabled="isProcessingPayment"
  :aria-busy="isProcessingPayment"
  @click="completePurchase"
>
  {{ isProcessingPayment ? 'Processing...' : 'Complete Purchase' }}
</button>
```

### CSS for Disabled Buttons

```css
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

button[aria-busy='true'] {
  position: relative;
}

/* Optional: Add loading spinner */
button[aria-busy='true']::after {
  content: '';
  position: absolute;
  right: 1rem;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## Cart Validation

### The Problem

Without validation:

- Users can proceed to checkout with empty carts
- Zero-value purchases can be tracked
- Edge cases cause unexpected behavior

### Solution: Validate Before Proceeding

```typescript
const beginCheckout = () => {
  // Validate cart not empty
  if (cart.value.length === 0) {
    console.warn('Cannot begin checkout: cart is empty');
    showError('Your cart is empty');
    return;
  }

  // Validate cart total > 0
  if (cartTotal.value <= 0) {
    console.warn('Cannot begin checkout: cart total must be greater than 0');
    showError('Cart total must be greater than 0');
    return;
  }

  // Proceed with checkout
  pushEcommerce(client, 'begin_checkout', {
    currency: 'USD',
    value: cartTotal.value,
    items: cart.value.map((item) => toGA4Item(item))
  });
};
```

---

## Accessibility for E-Commerce

### The Problem

E-commerce sites often have:

- Clickable divs instead of buttons
- Missing ARIA labels
- No keyboard navigation support
- No announcements for screen readers

### Solution: Proper ARIA Attributes

#### 1. Clickable Elements

```vue
<!-- ❌ Inaccessible -->
<div class="product-card" @click="selectProduct(product)">
  ...
</div>

<!-- ✅ Accessible -->
<article
  class="product-card"
  role="listitem"
  tabindex="0"
  :aria-label="`${product.name} by ${product.brand}, $${product.price}`"
  @click="selectProduct(product)"
  @keydown.enter="selectProduct(product)"
  @keydown.space.prevent="selectProduct(product)"
>
  ...
</article>
```

#### 2. Cart Status Announcements

```vue
<!-- Screen reader announcement for cart updates -->
<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {{ cartItemCount > 0
    ? `${cartItemCount} items in cart, total $${cartTotal.toFixed(2)}`
    : 'Cart is empty'
  }}
</div>
```

#### 3. Form Labels

```vue
<!-- ❌ Unlabeled input -->
<label>Card Number</label>
<input type="text" />

<!-- ✅ Properly linked label -->
<label for="card-number">Card Number</label>
<input id="card-number" type="text" aria-required="true" autocomplete="cc-number" />
```

#### 4. Focus Styles

```css
/* Visible focus indicators for keyboard users */
.product-card:focus,
.promo-banner:focus {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}

/* Modern browsers - only show on keyboard navigation */
.product-card:focus-visible,
.promo-banner:focus-visible {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}
```

#### 5. Screen Reader Only Content

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Implementation Examples

### Complete Vue Component Pattern

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { pushEcommerce } from '@jwiedeman/gtm-kit';
import { useGtmClient } from '@jwiedeman/gtm-kit-vue';

const client = useGtmClient();

// Debounce utility
const createDebounce = () => {
  const pending = new Set<string>();
  return {
    execute: async (key: string, action: () => void, delay = 300) => {
      if (pending.has(key)) return;
      pending.add(key);
      try {
        await action();
      } finally {
        setTimeout(() => pending.delete(key), delay);
      }
    },
    isPending: (key: string) => pending.has(key)
  };
};

const debounce = createDebounce();

// Loading states
const loadingProducts = ref<Set<string>>(new Set());
const isProcessingPayment = ref(false);

// Cart state
const cart = ref<CartItem[]>([]);
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0));

// Add to cart with debouncing and loading state
const addToCart = (product: Product) => {
  debounce.execute(
    `add-${product.id}`,
    () => {
      loadingProducts.value.add(product.id);
      try {
        cart.value.push({ ...product, quantity: 1 });
        pushEcommerce(client, 'add_to_cart', {
          currency: 'USD',
          value: product.price,
          items: [toGA4Item(product)]
        });
      } finally {
        setTimeout(() => loadingProducts.value.delete(product.id), 200);
      }
    },
    500
  );
};

// Check loading state
const isLoading = (id: string) => loadingProducts.value.has(id);

// Purchase with double-click prevention
const purchase = () => {
  if (isProcessingPayment.value || cart.value.length === 0) return;
  isProcessingPayment.value = true;

  try {
    pushEcommerce(client, 'purchase', {
      transaction_id: `TXN-${Date.now()}`,
      currency: 'USD',
      value: cartTotal.value,
      items: cart.value.map(toGA4Item)
    });
    cart.value = [];
  } finally {
    isProcessingPayment.value = false;
  }
};
</script>

<template>
  <!-- Screen reader cart announcement -->
  <div class="sr-only" role="status" aria-live="polite">{{ cart.length }} items in cart</div>

  <!-- Accessible product card -->
  <article
    v-for="product in products"
    :key="product.id"
    class="product-card"
    role="listitem"
    tabindex="0"
    :aria-label="`${product.name}, $${product.price}`"
    @keydown.enter="viewProduct(product)"
  >
    <h3>{{ product.name }}</h3>
    <p>${{ product.price }}</p>
    <button
      type="button"
      :disabled="isLoading(product.id)"
      :aria-busy="isLoading(product.id)"
      :aria-label="`Add ${product.name} to cart`"
      @click="addToCart(product)"
    >
      {{ isLoading(product.id) ? 'Adding...' : 'Add to Cart' }}
    </button>
  </article>

  <!-- Purchase button with loading state -->
  <button
    type="button"
    :disabled="isProcessingPayment || cart.length === 0"
    :aria-busy="isProcessingPayment"
    @click="purchase"
  >
    {{ isProcessingPayment ? 'Processing...' : 'Complete Purchase' }}
  </button>
</template>
```

---

## Checklist

### Defensive Coding

- [ ] Add debouncing to add-to-cart buttons
- [ ] Add loading states for all async operations
- [ ] Disable buttons during operations
- [ ] Prevent double-click on purchase buttons
- [ ] Validate cart before checkout
- [ ] Validate cart total > 0

### Accessibility

- [ ] Use `<button>` for clickable elements (or add `role="button"`)
- [ ] Add `tabindex="0"` for keyboard navigation
- [ ] Add keyboard handlers (`@keydown.enter`, `@keydown.space`)
- [ ] Add descriptive `aria-label` attributes
- [ ] Link form labels with `for`/`id` attributes
- [ ] Add `aria-required` to required fields
- [ ] Add `aria-busy` to loading buttons
- [ ] Add `aria-live` regions for dynamic updates
- [ ] Add visible focus styles
- [ ] Include `.sr-only` content for context

---

_Reference implementation: `examples/vue-app/src/views/Products.vue`_
