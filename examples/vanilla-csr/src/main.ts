import './style.css';
import { createGtmClient, pushEvent, pushEcommerce } from '@jwiedeman/gtm-kit';

type GtmWindow = Window & Record<string, unknown>;

type DataLayerArray = unknown[] & { push: (...values: unknown[]) => number };

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  variant: string;
}

interface CartItem extends Product {
  quantity: number;
}

type CheckoutStep = 'browse' | 'cart' | 'shipping' | 'payment' | 'complete';

const products: Product[] = [
  { id: 'SKU-001', name: 'Blue T-Shirt', price: 29.99, category: 'Clothing', brand: 'GTM Apparel', variant: 'Blue/M' },
  {
    id: 'SKU-002',
    name: 'Running Shoes',
    price: 89.99,
    category: 'Footwear',
    brand: 'SpeedRunner',
    variant: 'Black/10'
  },
  {
    id: 'SKU-003',
    name: 'Wireless Headphones',
    price: 149.99,
    category: 'Electronics',
    brand: 'SoundMax',
    variant: 'Black'
  },
  { id: 'SKU-004', name: 'Laptop Stand', price: 49.99, category: 'Accessories', brand: 'DeskPro', variant: 'Silver' }
];

let cart: CartItem[] = [];
let checkoutStep: CheckoutStep = 'browse';
let lastOrderId = '';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('Unable to locate #app root element.');
}

const rawContainers = (import.meta.env.VITE_GTM_CONTAINERS as string | undefined) ?? 'GTM-XXXX';
const containers = rawContainers
  .split(',')
  .map((id) => id.trim())
  .filter((id) => id.length > 0);

if (containers.length === 0) {
  containers.push('GTM-XXXX');
}

const client = createGtmClient({
  containers,
  dataLayerName: (import.meta.env.VITE_GTM_DATALAYER as string | undefined) ?? 'dataLayer',
  logger: import.meta.env.DEV ? console : undefined
});

const dataLayerName = client.dataLayerName;
const formattedContainers = containers.map(escapeHtml).join(', ');

// Helper functions
const toGA4Item = (product: Product, quantity = 1, index?: number) => ({
  item_id: product.id,
  item_name: product.name,
  item_brand: product.brand,
  item_category: product.category,
  item_variant: product.variant,
  price: product.price,
  quantity,
  ...(index !== undefined && { index })
});

const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

const render = () => {
  const cartTotal = getCartTotal();
  const cartCount = getCartCount();

  appRoot.innerHTML = `
    <main>
      <header>
        <h1>GTM Kit - Vanilla CSR</h1>
        <small>
          Containers: <code>${formattedContainers}</code>
          · Data layer: <code>${escapeHtml(dataLayerName)}</code>
        </small>
      </header>

      <section class="card">
        <h2>Demo Controls</h2>
        <p>Test consent mode and basic events alongside the e-commerce flow below.</p>
        <div class="button-row">
          <button data-variant="primary" data-action="pageview">Push page view</button>
          <button data-variant="ghost" data-action="cta">Push CTA event</button>
          <button data-variant="primary" data-action="grant-analytics">Grant analytics</button>
          <button data-variant="ghost" data-action="reset-consent">Reset consent</button>
        </div>
      </section>

      <section class="card">
        <h2>E-Commerce Demo</h2>
        <p class="desc">
          Full e-commerce tracking: view_item_list, select_item, view_item, add_to_cart, remove_from_cart,
          view_cart, begin_checkout, add_shipping_info, add_payment_info, purchase, refund
        </p>
        ${cartCount > 0 && checkoutStep === 'browse' ? `<button data-variant="primary" data-action="view-cart" class="cart-btn">View Cart (${cartCount})</button>` : ''}
      </section>

      ${checkoutStep === 'browse' ? renderBrowseView() : ''}
      ${checkoutStep === 'cart' ? renderCartView(cartTotal) : ''}
      ${checkoutStep === 'shipping' ? renderShippingView() : ''}
      ${checkoutStep === 'payment' ? renderPaymentView(cartTotal) : ''}
      ${checkoutStep === 'complete' ? renderCompleteView() : ''}

      <section class="card">
        <h2>Data layer snapshot</h2>
        <p>
          Live view of <code>window.${escapeHtml(dataLayerName)}</code>. Updates whenever the data layer mutates.
        </p>
        <pre data-role="data-layer">[]</pre>
      </section>
    </main>
  `;

  attachEventListeners();
  renderDataLayer();
};

const renderBrowseView = () => `
  <section class="card products-card">
    <div class="products-grid">
      ${products
        .map(
          (product, index) => `
        <div class="product-card" data-product-index="${index}">
          <div class="product-image">${product.brand.charAt(0)}</div>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="brand">${escapeHtml(product.brand)}</p>
          <p class="price">$${product.price.toFixed(2)}</p>
          <p class="category">${escapeHtml(product.category)}</p>
          <button data-variant="primary" data-action="add-to-cart" data-product-index="${index}">Add to Cart</button>
        </div>
      `
        )
        .join('')}
    </div>
  </section>
`;

const renderCartView = (cartTotal: number) => `
  <section class="card checkout-panel">
    <h2>Your Cart</h2>
    <div class="cart-items">
      ${cart
        .map(
          (item) => `
        <div class="cart-item">
          <div class="item-info">
            <h4>${escapeHtml(item.name)}</h4>
            <p>Qty: ${item.quantity} × $${item.price.toFixed(2)}</p>
          </div>
          <button data-variant="danger" data-action="remove-from-cart" data-product-id="${item.id}">Remove</button>
        </div>
      `
        )
        .join('')}
    </div>
    <div class="cart-summary">
      <p class="total">Total: $${cartTotal.toFixed(2)}</p>
      <div class="button-row">
        <button data-variant="ghost" data-action="continue-shopping">Continue Shopping</button>
        <button data-variant="primary" data-action="begin-checkout">Begin Checkout</button>
      </div>
    </div>
  </section>
`;

const renderShippingView = () => `
  <section class="card checkout-panel">
    <h2>Shipping (Step 1/2)</h2>
    <div class="form-mock">
      <p>Address: 123 Main St, City, ST 12345</p>
      <p>Method: Standard Shipping ($5.99)</p>
    </div>
    <button data-variant="primary" data-action="add-shipping">Continue to Payment</button>
  </section>
`;

const renderPaymentView = (cartTotal: number) => `
  <section class="card checkout-panel">
    <h2>Payment (Step 2/2)</h2>
    <div class="form-mock">
      <p>Card: **** **** **** 4242</p>
      <p>Subtotal: $${cartTotal.toFixed(2)}</p>
      <p>Tax (8%): $${(cartTotal * 0.08).toFixed(2)}</p>
      <p>Shipping: $5.99</p>
      <p class="grand-total">Total: $${(cartTotal * 1.08 + 5.99).toFixed(2)}</p>
    </div>
    <button data-variant="primary" data-action="complete-purchase">Complete Purchase</button>
  </section>
`;

const renderCompleteView = () => `
  <section class="card checkout-panel complete">
    <div class="success-icon">✓</div>
    <h2>Order Complete!</h2>
    <p class="order-id">${lastOrderId}</p>
    <div class="button-row">
      <button data-variant="danger" data-action="request-refund">Request Refund</button>
      <button data-variant="primary" data-action="back-to-browse">Continue Shopping</button>
    </div>
  </section>
`;

const readDataLayer = (): unknown[] => {
  const layer = (window as unknown as GtmWindow)[dataLayerName];
  return Array.isArray(layer) ? layer : [];
};

const renderDataLayer = () => {
  const dataLayerOutput = appRoot.querySelector<HTMLPreElement>('[data-role="data-layer"]');
  if (!dataLayerOutput) {
    return;
  }

  const snapshot = readDataLayer();
  dataLayerOutput.textContent = JSON.stringify(snapshot, null, 2);
};

const attachEventListeners = () => {
  // Basic events
  on('pageview', () => {
    pushEvent(client, 'page_view', {
      page_title: 'Manual page view',
      page_path: `/demo/${Date.now()}`
    });
  });

  on('cta', () => {
    pushEvent(client, 'cta_click', {
      cta_label: 'Get started',
      timestamp: new Date().toISOString()
    });
  });

  on('grant-analytics', () => {
    client.updateConsent({ analytics_storage: 'granted' });
  });

  on('reset-consent', () => {
    client.updateConsent({ analytics_storage: 'denied', ad_storage: 'denied' });
  });

  // Product card clicks
  appRoot.querySelectorAll<HTMLDivElement>('.product-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      const index = parseInt(card.dataset.productIndex || '0');
      const product = products[index];

      pushEcommerce(client, 'select_item', {
        item_list_id: 'products_main',
        item_list_name: 'Products Page',
        items: [toGA4Item(product, 1, index)]
      });
      pushEcommerce(client, 'view_item', {
        currency: 'USD',
        value: product.price,
        items: [toGA4Item(product)]
      });
    });
  });

  // Add to cart
  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="add-to-cart"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.productIndex || '0');
      const product = products[index];

      const existing = cart.find((i) => i.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }

      pushEcommerce(client, 'add_to_cart', {
        currency: 'USD',
        value: product.price,
        items: [toGA4Item(product)]
      });
      render();
    });
  });

  // View cart
  on('view-cart', () => {
    checkoutStep = 'cart';
    pushEcommerce(client, 'view_cart', {
      currency: 'USD',
      value: getCartTotal(),
      items: cart.map((item, i) => toGA4Item(item, item.quantity, i))
    });
    render();
  });

  // Remove from cart
  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="remove-from-cart"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId;
      const item = cart.find((i) => i.id === productId);
      if (item) {
        pushEcommerce(client, 'remove_from_cart', {
          currency: 'USD',
          value: item.price * item.quantity,
          items: [toGA4Item(item, item.quantity)]
        });
        cart = cart.filter((i) => i.id !== productId);
        render();
      }
    });
  });

  // Continue shopping
  on('continue-shopping', () => {
    checkoutStep = 'browse';
    render();
  });

  // Begin checkout
  on('begin-checkout', () => {
    pushEcommerce(client, 'begin_checkout', {
      currency: 'USD',
      value: getCartTotal(),
      items: cart.map((item) => toGA4Item(item, item.quantity))
    });
    checkoutStep = 'shipping';
    render();
  });

  // Add shipping
  on('add-shipping', () => {
    pushEcommerce(client, 'add_shipping_info', {
      currency: 'USD',
      value: getCartTotal(),
      shipping_tier: 'Standard',
      items: cart.map((item) => toGA4Item(item, item.quantity))
    });
    checkoutStep = 'payment';
    render();
  });

  // Complete purchase
  on('complete-purchase', () => {
    const cartTotal = getCartTotal();
    const orderId = `TXN-${Date.now()}`;
    lastOrderId = orderId;

    pushEcommerce(client, 'add_payment_info', {
      currency: 'USD',
      value: cartTotal,
      payment_type: 'Credit Card',
      items: cart.map((item) => toGA4Item(item, item.quantity))
    });

    pushEcommerce(client, 'purchase', {
      transaction_id: orderId,
      currency: 'USD',
      value: cartTotal,
      tax: cartTotal * 0.08,
      shipping: 5.99,
      items: cart.map((item) => toGA4Item(item, item.quantity))
    });

    cart = [];
    checkoutStep = 'complete';
    render();
  });

  // Request refund
  on('request-refund', () => {
    pushEcommerce(client, 'refund', {
      transaction_id: lastOrderId,
      currency: 'USD',
      value: 0,
      items: []
    });
    pushEvent(client, 'refund_requested', { order_id: lastOrderId });
    lastOrderId = '';
    checkoutStep = 'browse';
    render();
  });

  // Back to browse
  on('back-to-browse', () => {
    checkoutStep = 'browse';
    render();
  });
};

const on = (action: string, handler: () => void) => {
  const button = appRoot.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
  if (!button) {
    return;
  }
  button.addEventListener('click', handler);
};

// Initialize
client.setConsentDefaults({ analytics_storage: 'denied', ad_storage: 'denied' });
pushEvent(client, 'page_view', {
  page_title: 'Vanilla CSR landing',
  page_path: window.location.pathname || '/'
});
client.init();

// Track view_item_list on page load
pushEcommerce(client, 'view_item_list', {
  item_list_id: 'products_main',
  item_list_name: 'Products Page',
  items: products.map((p, i) => toGA4Item(p, 1, i))
});

// Patch dataLayer push to auto-render
const globalLayer = (window as unknown as GtmWindow)[dataLayerName];
if (Array.isArray(globalLayer)) {
  const array = globalLayer as DataLayerArray;
  const originalPush = array.push.bind(array);
  array.push = ((...values: unknown[]) => {
    const result = originalPush(...values);
    queueMicrotask(renderDataLayer);
    return result;
  }) as DataLayerArray['push'];
}

// Initial render
render();
