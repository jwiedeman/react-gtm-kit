<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { pushEcommerce } from '@jwiedeman/gtm-kit';
import { useGtmClient, useGtmPush } from '@jwiedeman/gtm-kit-vue';

const client = useGtmClient();
const push = useGtmPush();

// Product data types
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  variant?: string;
  list_name?: string;
  index?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Promotion {
  id: string;
  name: string;
  creative_name: string;
  creative_slot: string;
}

// =============================================================================
// DEFENSIVE CODING: Loading states and debouncing utilities
// =============================================================================

/**
 * Simple debounce utility to prevent rapid duplicate actions.
 * Used for add-to-cart buttons to prevent accidental double-clicks.
 */
const createDebounce = () => {
  const pendingActions = new Set<string>();

  return {
    /**
     * Execute an action with debouncing - prevents duplicate calls for the same key
     */
    execute: async (key: string, action: () => void | Promise<void>, delayMs = 300) => {
      if (pendingActions.has(key)) {
        return; // Action already pending, skip
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

const debounce = createDebounce();

// Loading states for UI feedback
const isAddingToCart = ref<Set<string>>(new Set());
const isProcessingCheckout = ref(false);
const isProcessingPayment = ref(false);

// Sample products representing a real catalog
const products = ref<Product[]>([
  { id: 'SKU-001', name: 'Blue T-Shirt', price: 29.99, category: 'Clothing', brand: 'GTM Apparel', variant: 'Blue/M' },
  { id: 'SKU-002', name: 'Running Shoes', price: 89.99, category: 'Footwear', brand: 'SpeedRunner', variant: 'Black/10' },
  { id: 'SKU-003', name: 'Wireless Headphones', price: 149.99, category: 'Electronics', brand: 'SoundMax', variant: 'Black' },
  { id: 'SKU-004', name: 'Laptop Stand', price: 49.99, category: 'Accessories', brand: 'DeskPro', variant: 'Silver' },
  { id: 'SKU-005', name: 'Cotton Hoodie', price: 59.99, category: 'Clothing', brand: 'GTM Apparel', variant: 'Gray/L' },
  { id: 'SKU-006', name: 'Smart Watch', price: 199.99, category: 'Electronics', brand: 'TechTime', variant: 'Silver' }
]);

// Sample promotions
const promotions = ref<Promotion[]>([
  { id: 'PROMO-001', name: 'Summer Sale 20% Off', creative_name: 'summer_banner', creative_slot: 'hero_banner' },
  { id: 'PROMO-002', name: 'Free Shipping Over $50', creative_name: 'shipping_banner', creative_slot: 'sidebar' }
]);

// Cart and checkout state
const cart = ref<CartItem[]>([]);
const selectedProduct = ref<Product | null>(null);
const checkoutStep = ref<'cart' | 'shipping' | 'payment' | 'complete' | null>(null);
const orderComplete = ref(false);
const lastOrderId = ref('');

// Computed
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const cartItemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));

// Convert product to GA4 item format
const toGA4Item = (product: Product, quantity = 1, index?: number) => ({
  item_id: product.id,
  item_name: product.name,
  item_brand: product.brand,
  item_category: product.category,
  item_variant: product.variant,
  price: product.price,
  quantity,
  ...(index !== undefined && { index }),
  ...(product.list_name && { item_list_name: product.list_name })
});

// Track view_item_list on mount
onMounted(() => {
  const listItems = products.value.map((p, index) => ({
    ...p,
    list_name: 'Products Page',
    index
  }));

  pushEcommerce(client, 'view_item_list', {
    item_list_id: 'products_main',
    item_list_name: 'Products Page',
    items: listItems.map((p, i) => toGA4Item(p, 1, i))
  });

  // Track promotion views
  push({
    event: 'view_promotion',
    ecommerce: {
      items: promotions.value.map((promo) => ({
        promotion_id: promo.id,
        promotion_name: promo.name,
        creative_name: promo.creative_name,
        creative_slot: promo.creative_slot
      }))
    }
  });
});

// Track select_item when clicking a product
const selectProduct = (product: Product, index: number) => {
  pushEcommerce(client, 'select_item', {
    item_list_id: 'products_main',
    item_list_name: 'Products Page',
    items: [toGA4Item({ ...product, list_name: 'Products Page' }, 1, index)]
  });

  // Show product detail
  selectedProduct.value = product;

  // Track view_item
  pushEcommerce(client, 'view_item', {
    currency: 'USD',
    value: product.price,
    items: [toGA4Item(product)]
  });
};

// Track select_promotion
const selectPromotion = (promo: Promotion) => {
  push({
    event: 'select_promotion',
    ecommerce: {
      items: [{
        promotion_id: promo.id,
        promotion_name: promo.name,
        creative_name: promo.creative_name,
        creative_slot: promo.creative_slot
      }]
    }
  });
};

// Add to cart with debouncing and loading state
const addToCart = (product: Product) => {
  debounce.execute(`add-${product.id}`, () => {
    // Set loading state
    isAddingToCart.value.add(product.id);

    try {
      const existingItem = cart.value.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.value.push({ ...product, quantity: 1 });
      }

      pushEcommerce(client, 'add_to_cart', {
        currency: 'USD',
        value: product.price,
        items: [toGA4Item(product)]
      });

      selectedProduct.value = null;
    } finally {
      // Clear loading state after a brief delay for visual feedback
      setTimeout(() => {
        isAddingToCart.value.delete(product.id);
      }, 200);
    }
  }, 500); // 500ms debounce to prevent double-clicks
};

// Helper to check if add-to-cart is in progress for a product
const isAddingProduct = (productId: string) => isAddingToCart.value.has(productId);

// Remove from cart
const removeFromCart = (item: CartItem) => {
  const index = cart.value.findIndex((i) => i.id === item.id);
  if (index > -1) {
    pushEcommerce(client, 'remove_from_cart', {
      currency: 'USD',
      value: item.price * item.quantity,
      items: [toGA4Item(item, item.quantity)]
    });
    cart.value.splice(index, 1);
  }
};

// Update quantity
const updateQuantity = (item: CartItem, delta: number) => {
  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeFromCart(item);
    return;
  }

  if (delta > 0) {
    pushEcommerce(client, 'add_to_cart', {
      currency: 'USD',
      value: item.price,
      items: [toGA4Item(item, 1)]
    });
  } else {
    pushEcommerce(client, 'remove_from_cart', {
      currency: 'USD',
      value: item.price,
      items: [toGA4Item(item, 1)]
    });
  }

  item.quantity = newQty;
};

// View cart
const viewCart = () => {
  checkoutStep.value = 'cart';

  pushEcommerce(client, 'view_cart', {
    currency: 'USD',
    value: cartTotal.value,
    items: cart.value.map((item, index) => toGA4Item(item, item.quantity, index))
  });
};

// Begin checkout with validation
const beginCheckout = () => {
  // Validate cart not empty
  if (cart.value.length === 0) {
    console.warn('Cannot begin checkout: cart is empty');
    return;
  }

  // Validate cart total > 0
  if (cartTotal.value <= 0) {
    console.warn('Cannot begin checkout: cart total must be greater than 0');
    return;
  }

  isProcessingCheckout.value = true;

  pushEcommerce(client, 'begin_checkout', {
    currency: 'USD',
    value: cartTotal.value,
    items: cart.value.map((item) => toGA4Item(item, item.quantity))
  });

  checkoutStep.value = 'shipping';
  isProcessingCheckout.value = false;
};

// Add shipping info
const addShippingInfo = () => {
  pushEcommerce(client, 'add_shipping_info', {
    currency: 'USD',
    value: cartTotal.value,
    shipping_tier: 'Standard',
    items: cart.value.map((item) => toGA4Item(item, item.quantity))
  });

  checkoutStep.value = 'payment';
};

// Add payment info with double-click prevention
const addPaymentInfo = () => {
  // Prevent double-submission
  if (isProcessingPayment.value) {
    console.warn('Payment already in progress');
    return;
  }

  isProcessingPayment.value = true;

  pushEcommerce(client, 'add_payment_info', {
    currency: 'USD',
    value: cartTotal.value,
    payment_type: 'Credit Card',
    items: cart.value.map((item) => toGA4Item(item, item.quantity))
  });

  // Complete purchase
  completePurchase();
};

// Complete purchase
const completePurchase = () => {
  const transactionId = `TXN-${Date.now()}`;
  lastOrderId.value = transactionId;

  pushEcommerce(client, 'purchase', {
    transaction_id: transactionId,
    currency: 'USD',
    value: cartTotal.value,
    tax: cartTotal.value * 0.08,
    shipping: 5.99,
    items: cart.value.map((item) => toGA4Item(item, item.quantity))
  });

  cart.value = [];
  checkoutStep.value = 'complete';
  orderComplete.value = true;
  isProcessingPayment.value = false;
};

// Request refund (for demo)
const requestRefund = () => {
  if (!lastOrderId.value) return;

  pushEcommerce(client, 'refund', {
    transaction_id: lastOrderId.value,
    currency: 'USD',
    value: 0, // Partial refund example
    items: []
  });

  push({
    event: 'refund_requested',
    order_id: lastOrderId.value,
    reason: 'Customer request'
  });

  lastOrderId.value = '';
  orderComplete.value = false;
  checkoutStep.value = null;
};

// Close modals
const closeModal = () => {
  selectedProduct.value = null;
  checkoutStep.value = null;
};
</script>

<template>
  <div class="products-page">
    <!-- Promotions Banner - Accessible clickable elements -->
    <div class="promotions" role="region" aria-label="Current promotions">
      <div
        v-for="promo in promotions"
        :key="promo.id"
        class="promo-banner"
        :class="promo.creative_slot"
        role="button"
        tabindex="0"
        :aria-label="`${promo.name} - Click to shop this promotion`"
        @click="selectPromotion(promo)"
        @keydown.enter="selectPromotion(promo)"
        @keydown.space.prevent="selectPromotion(promo)"
      >
        <span class="promo-text">{{ promo.name }}</span>
        <span class="promo-cta" aria-hidden="true">Shop Now</span>
      </div>
    </div>

    <div class="page-header">
      <h1>Products</h1>
      <p class="subtitle">
        Full e-commerce tracking demo: view_item_list, select_item, view_item, add_to_cart,
        remove_from_cart, view_cart, begin_checkout, add_shipping_info, add_payment_info,
        purchase, refund, view_promotion, select_promotion
      </p>
      <button v-if="cartItemCount > 0" class="cart-btn" @click="viewCart">
        View Cart ({{ cartItemCount }})
      </button>
    </div>

    <!-- Cart status announcement for screen readers -->
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ cartItemCount > 0 ? `${cartItemCount} items in cart, total $${cartTotal.toFixed(2)}` : 'Cart is empty' }}
    </div>

    <!-- Product Grid - Accessible product cards -->
    <div class="products-grid" role="list" aria-label="Product catalog">
      <article
        v-for="(product, index) in products"
        :key="product.id"
        class="product-card"
        role="listitem"
        tabindex="0"
        :aria-label="`${product.name} by ${product.brand}, $${product.price.toFixed(2)}`"
        @click="selectProduct(product, index)"
        @keydown.enter="selectProduct(product, index)"
        @keydown.space.prevent="selectProduct(product, index)"
      >
        <div class="product-image" aria-hidden="true">{{ product.brand.charAt(0) }}</div>
        <h3>{{ product.name }}</h3>
        <p class="brand">{{ product.brand }}</p>
        <p class="price">${{ product.price.toFixed(2) }}</p>
        <p class="category">{{ product.category }}</p>
        <button
          type="button"
          :disabled="isAddingProduct(product.id)"
          :aria-busy="isAddingProduct(product.id)"
          :aria-label="`Add ${product.name} to cart`"
          @click.stop="addToCart(product)"
        >
          {{ isAddingProduct(product.id) ? 'Adding...' : 'Add to Cart' }}
        </button>
      </article>
    </div>

    <!-- Product Detail Modal -->
    <div v-if="selectedProduct" class="modal-overlay" @click.self="closeModal">
      <div class="modal product-modal">
        <button class="close-btn" @click="closeModal">&times;</button>
        <div class="product-detail">
          <div class="product-image large">{{ selectedProduct.brand.charAt(0) }}</div>
          <div class="product-info">
            <h2>{{ selectedProduct.name }}</h2>
            <p class="brand">{{ selectedProduct.brand }}</p>
            <p class="variant">Variant: {{ selectedProduct.variant }}</p>
            <p class="price">${{ selectedProduct.price.toFixed(2) }}</p>
            <p class="category">Category: {{ selectedProduct.category }}</p>
            <button class="add-to-cart-btn" @click="addToCart(selectedProduct)">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart/Checkout Modal -->
    <div v-if="checkoutStep" class="modal-overlay" @click.self="closeModal">
      <div class="modal checkout-modal">
        <button class="close-btn" @click="closeModal">&times;</button>

        <!-- Cart View -->
        <div v-if="checkoutStep === 'cart'" class="checkout-step">
          <h2>Your Cart</h2>
          <div v-if="cart.length === 0" class="empty-cart">
            <p>Your cart is empty</p>
          </div>
          <div v-else>
            <div v-for="item in cart" :key="item.id" class="cart-item">
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p class="item-variant">{{ item.variant }}</p>
                <p class="item-price">${{ item.price.toFixed(2) }} each</p>
              </div>
              <div class="item-controls">
                <button class="qty-btn" @click="updateQuantity(item, -1)">-</button>
                <span class="qty">{{ item.quantity }}</span>
                <button class="qty-btn" @click="updateQuantity(item, 1)">+</button>
                <button class="remove-btn" @click="removeFromCart(item)">Remove</button>
              </div>
            </div>
            <div class="cart-summary">
              <p class="total">Total: ${{ cartTotal.toFixed(2) }}</p>
              <button class="checkout-btn" @click="beginCheckout">Begin Checkout</button>
            </div>
          </div>
        </div>

        <!-- Shipping Step - Accessible form -->
        <div v-if="checkoutStep === 'shipping'" class="checkout-step" role="form" aria-labelledby="shipping-heading">
          <h2 id="shipping-heading">Shipping Information</h2>
          <div class="step-indicator" aria-label="Checkout progress">Step 1 of 3</div>
          <div class="form-group">
            <label for="shipping-address">Shipping Address</label>
            <input
              id="shipping-address"
              type="text"
              placeholder="123 Main St"
              value="123 Main St, City, ST 12345"
              aria-required="true"
            />
          </div>
          <div class="form-group">
            <label for="shipping-method">Shipping Method</label>
            <select id="shipping-method" aria-required="true">
              <option>Standard Shipping ($5.99)</option>
              <option>Express Shipping ($12.99)</option>
            </select>
          </div>
          <button
            type="button"
            class="continue-btn"
            aria-label="Continue to payment step"
            @click="addShippingInfo"
          >
            Continue to Payment
          </button>
        </div>

        <!-- Payment Step - Accessible form with loading state -->
        <div v-if="checkoutStep === 'payment'" class="checkout-step" role="form" aria-labelledby="payment-heading">
          <h2 id="payment-heading">Payment Information</h2>
          <div class="step-indicator" aria-label="Checkout progress">Step 2 of 3</div>
          <div class="form-group">
            <label for="card-number">Card Number</label>
            <input
              id="card-number"
              type="text"
              placeholder="4242 4242 4242 4242"
              value="4242 4242 4242 4242"
              aria-required="true"
              autocomplete="cc-number"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="card-expiry">Expiry</label>
              <input
                id="card-expiry"
                type="text"
                placeholder="12/25"
                value="12/25"
                aria-required="true"
                autocomplete="cc-exp"
              />
            </div>
            <div class="form-group">
              <label for="card-cvv">CVV</label>
              <input
                id="card-cvv"
                type="text"
                placeholder="123"
                value="123"
                aria-required="true"
                autocomplete="cc-csc"
              />
            </div>
          </div>
          <div class="order-summary" role="region" aria-label="Order summary">
            <p>Subtotal: ${{ cartTotal.toFixed(2) }}</p>
            <p>Tax (8%): ${{ (cartTotal * 0.08).toFixed(2) }}</p>
            <p>Shipping: $5.99</p>
            <p class="grand-total">Total: ${{ (cartTotal * 1.08 + 5.99).toFixed(2) }}</p>
          </div>
          <button
            type="button"
            class="pay-btn"
            :disabled="isProcessingPayment"
            :aria-busy="isProcessingPayment"
            aria-label="Complete your purchase"
            @click="addPaymentInfo"
          >
            {{ isProcessingPayment ? 'Processing...' : 'Complete Purchase' }}
          </button>
        </div>

        <!-- Order Complete -->
        <div v-if="checkoutStep === 'complete'" class="checkout-step complete">
          <div class="success-icon">✓</div>
          <h2>Order Complete!</h2>
          <p class="order-id">Order ID: {{ lastOrderId }}</p>
          <p>Thank you for your purchase. Check the console to see the purchase event.</p>
          <div class="complete-actions">
            <button class="refund-btn" @click="requestRefund">Request Refund (Demo)</button>
            <button class="close-btn-text" @click="closeModal">Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Refund Success Message -->
    <div v-if="orderComplete && !lastOrderId && !checkoutStep" class="refund-notice">
      <p>Refund has been processed. The refund event has been pushed to the dataLayer.</p>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  padding: 1rem 0;
}

/* Promotions */
.promotions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.promo-banner {
  flex: 1;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s;
}

.promo-banner:hover {
  transform: scale(1.02);
}

.promo-banner.hero_banner {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.promo-banner.sidebar {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.promo-text {
  font-weight: 600;
}

.promo-cta {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

/* Page Header */
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
}

.subtitle {
  flex: 1 1 100%;
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

.cart-btn {
  background: #27ae60;
  color: white;
  padding: 0.5rem 1rem;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
}

.product-image.large {
  width: 120px;
  height: 120px;
  font-size: 3rem;
}

.product-card h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.brand {
  color: #6c757d;
  font-size: 0.8rem;
  margin: 0 0 0.25rem;
}

.price {
  font-size: 1.125rem;
  font-weight: 600;
  color: #27ae60;
  margin: 0 0 0.25rem;
}

.category {
  color: #6c757d;
  font-size: 0.75rem;
  margin: 0 0 0.75rem;
}

.product-card button {
  width: 100%;
  background: #3498db;
  color: white;
  font-size: 0.875rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

/* Product Detail */
.product-detail {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.product-info h2 {
  margin: 0 0 0.5rem;
}

.product-info .variant {
  color: #6c757d;
  margin: 0.5rem 0;
}

.add-to-cart-btn {
  margin-top: 1rem;
  background: #27ae60;
  color: white;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* Checkout Steps */
.checkout-step h2 {
  margin: 0 0 1rem;
}

.step-indicator {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e9ecef;
}

.item-info h4 {
  margin: 0 0 0.25rem;
}

.item-variant {
  color: #6c757d;
  font-size: 0.8rem;
  margin: 0;
}

.item-price {
  color: #27ae60;
  font-weight: 500;
  margin: 0.25rem 0 0;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qty-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: #e9ecef;
  color: #333;
}

.qty {
  min-width: 2rem;
  text-align: center;
}

.remove-btn {
  background: #e74c3c;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.cart-summary {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #e9ecef;
}

.total {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.checkout-btn,
.continue-btn,
.pay-btn {
  width: 100%;
  background: #27ae60;
  color: white;
  padding: 0.75rem;
  font-size: 1rem;
}

.pay-btn {
  background: #3498db;
}

/* Forms */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.order-summary {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.order-summary p {
  margin: 0.25rem 0;
}

.grand-total {
  font-weight: 600;
  font-size: 1.125rem;
  margin-top: 0.5rem !important;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
}

/* Complete */
.checkout-step.complete {
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #27ae60;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1rem;
}

.order-id {
  color: #6c757d;
  font-family: monospace;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.refund-btn {
  flex: 1;
  background: #e74c3c;
  color: white;
}

.close-btn-text {
  flex: 1;
  background: #3498db;
  color: white;
}

.empty-cart {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.refund-notice {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}

/* =============================================================================
   ACCESSIBILITY: Screen reader only content
   ============================================================================= */
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

/* =============================================================================
   DEFENSIVE CODING: Disabled button states
   ============================================================================= */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

button[aria-busy="true"] {
  position: relative;
}

/* Focus styles for keyboard navigation */
.promo-banner:focus,
.product-card:focus {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}

.promo-banner:focus-visible,
.product-card:focus-visible {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}
</style>
