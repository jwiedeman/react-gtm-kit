<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

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

  const products: Product[] = [
    { id: 'SKU-001', name: 'Blue T-Shirt', price: 29.99, category: 'Clothing', brand: 'GTM Apparel', variant: 'Blue/M' },
    { id: 'SKU-002', name: 'Running Shoes', price: 89.99, category: 'Footwear', brand: 'SpeedRunner', variant: 'Black/10' },
    { id: 'SKU-003', name: 'Wireless Headphones', price: 149.99, category: 'Electronics', brand: 'SoundMax', variant: 'Black' },
    { id: 'SKU-004', name: 'Laptop Stand', price: 49.99, category: 'Accessories', brand: 'DeskPro', variant: 'Silver' }
  ];

  let cart: CartItem[] = [];
  let checkoutStep: 'browse' | 'cart' | 'shipping' | 'payment' | 'complete' = 'browse';
  let lastOrderId = '';

  $: cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $: cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getDataLayer = () => {
    if (!browser) return null;
    const layer = (window as unknown as { svelteDataLayer?: unknown[] }).svelteDataLayer;
    return Array.isArray(layer) ? layer : null;
  };

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

  const pushEcommerce = (event: string, ecommerce: Record<string, unknown>) => {
    const layer = getDataLayer();
    if (layer) {
      layer.push({ event, ecommerce });
    }
  };

  onMount(() => {
    // Track view_item_list
    pushEcommerce('view_item_list', {
      item_list_id: 'products_main',
      item_list_name: 'Products Page',
      items: products.map((p, i) => toGA4Item(p, 1, i))
    });
  });

  function viewProduct(product: Product, index: number) {
    pushEcommerce('select_item', {
      item_list_id: 'products_main',
      item_list_name: 'Products Page',
      items: [toGA4Item(product, 1, index)]
    });
    pushEcommerce('view_item', {
      currency: 'USD',
      value: product.price,
      items: [toGA4Item(product)]
    });
  }

  function addToCart(product: Product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
      cart = [...cart];
    } else {
      cart = [...cart, { ...product, quantity: 1 }];
    }
    pushEcommerce('add_to_cart', {
      currency: 'USD',
      value: product.price,
      items: [toGA4Item(product)]
    });
  }

  function removeFromCart(item: CartItem) {
    pushEcommerce('remove_from_cart', {
      currency: 'USD',
      value: item.price * item.quantity,
      items: [toGA4Item(item, item.quantity)]
    });
    cart = cart.filter(i => i.id !== item.id);
  }

  function viewCart() {
    checkoutStep = 'cart';
    pushEcommerce('view_cart', {
      currency: 'USD',
      value: cartTotal,
      items: cart.map((item, i) => toGA4Item(item, item.quantity, i))
    });
  }

  function beginCheckout() {
    pushEcommerce('begin_checkout', {
      currency: 'USD',
      value: cartTotal,
      items: cart.map(item => toGA4Item(item, item.quantity))
    });
    checkoutStep = 'shipping';
  }

  function addShipping() {
    pushEcommerce('add_shipping_info', {
      currency: 'USD',
      value: cartTotal,
      shipping_tier: 'Standard',
      items: cart.map(item => toGA4Item(item, item.quantity))
    });
    checkoutStep = 'payment';
  }

  function addPayment() {
    pushEcommerce('add_payment_info', {
      currency: 'USD',
      value: cartTotal,
      payment_type: 'Credit Card',
      items: cart.map(item => toGA4Item(item, item.quantity))
    });
    completePurchase();
  }

  function completePurchase() {
    const orderId = `TXN-${Date.now()}`;
    lastOrderId = orderId;
    pushEcommerce('purchase', {
      transaction_id: orderId,
      currency: 'USD',
      value: cartTotal,
      tax: cartTotal * 0.08,
      shipping: 5.99,
      items: cart.map(item => toGA4Item(item, item.quantity))
    });
    cart = [];
    checkoutStep = 'complete';
  }

  function requestRefund() {
    pushEcommerce('refund', {
      transaction_id: lastOrderId,
      currency: 'USD',
      value: 0
    });
    const layer = getDataLayer();
    if (layer) {
      layer.push({ event: 'refund_requested', order_id: lastOrderId });
    }
    lastOrderId = '';
    checkoutStep = 'browse';
  }
</script>

<div class="products-page">
  <div class="page-header">
    <h1>Products</h1>
    <p class="description">
      Full e-commerce tracking: view_item_list, select_item, view_item, add_to_cart, remove_from_cart,
      view_cart, begin_checkout, add_shipping_info, add_payment_info, purchase, refund
    </p>
    {#if cartCount > 0 && checkoutStep === 'browse'}
      <button class="cart-btn" on:click={viewCart}>View Cart ({cartCount})</button>
    {/if}
  </div>

  {#if checkoutStep === 'browse'}
    <div class="products-grid">
      {#each products as product, index}
        <div class="product-card" on:click={() => viewProduct(product, index)} on:keydown>
          <div class="product-image">{product.brand.charAt(0)}</div>
          <h3>{product.name}</h3>
          <p class="brand">{product.brand}</p>
          <p class="price">${product.price.toFixed(2)}</p>
          <p class="category">{product.category}</p>
          <button on:click|stopPropagation={() => addToCart(product)}>Add to Cart</button>
        </div>
      {/each}
    </div>
  {/if}

  {#if checkoutStep === 'cart'}
    <div class="checkout-panel">
      <h2>Your Cart</h2>
      {#each cart as item}
        <div class="cart-item">
          <div class="item-info">
            <h4>{item.name}</h4>
            <p>Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
          </div>
          <button class="remove-btn" on:click={() => removeFromCart(item)}>Remove</button>
        </div>
      {/each}
      <div class="cart-summary">
        <p class="total">Total: ${cartTotal.toFixed(2)}</p>
        <div class="button-row">
          <button class="secondary" on:click={() => (checkoutStep = 'browse')}>Continue Shopping</button>
          <button class="primary" on:click={beginCheckout}>Begin Checkout</button>
        </div>
      </div>
    </div>
  {/if}

  {#if checkoutStep === 'shipping'}
    <div class="checkout-panel">
      <h2>Shipping (Step 1/2)</h2>
      <div class="form-mock">
        <p>Address: 123 Main St, City, ST 12345</p>
        <p>Method: Standard Shipping ($5.99)</p>
      </div>
      <button class="primary" on:click={addShipping}>Continue to Payment</button>
    </div>
  {/if}

  {#if checkoutStep === 'payment'}
    <div class="checkout-panel">
      <h2>Payment (Step 2/2)</h2>
      <div class="form-mock">
        <p>Card: **** **** **** 4242</p>
        <p>Subtotal: ${cartTotal.toFixed(2)}</p>
        <p>Tax (8%): ${(cartTotal * 0.08).toFixed(2)}</p>
        <p>Shipping: $5.99</p>
        <p class="grand-total">Total: ${(cartTotal * 1.08 + 5.99).toFixed(2)}</p>
      </div>
      <button class="primary" on:click={addPayment}>Complete Purchase</button>
    </div>
  {/if}

  {#if checkoutStep === 'complete'}
    <div class="checkout-panel complete">
      <div class="success-icon">✓</div>
      <h2>Order Complete!</h2>
      <p class="order-id">{lastOrderId}</p>
      <div class="button-row">
        <button class="danger" on:click={requestRefund}>Request Refund</button>
        <button class="primary" on:click={() => (checkoutStep = 'browse')}>Continue Shopping</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .products-page {
    padding: 1rem 0;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    margin: 0 0 0.5rem;
  }

  .description {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .cart-btn {
    background: #27ae60;
    color: white;
  }

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

  .checkout-panel {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
  }

  .checkout-panel h2 {
    margin: 0 0 1rem;
  }

  .cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .item-info h4 {
    margin: 0 0 0.25rem;
  }

  .item-info p {
    margin: 0;
    color: #666;
    font-size: 0.875rem;
  }

  .remove-btn {
    background: #e74c3c;
    color: white;
    font-size: 0.75rem;
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

  .button-row {
    display: flex;
    gap: 0.5rem;
  }

  .button-row button {
    flex: 1;
  }

  .primary {
    background: #27ae60;
    color: white;
  }

  .secondary {
    background: #6c757d;
    color: white;
  }

  .danger {
    background: #e74c3c;
    color: white;
  }

  .form-mock {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .form-mock p {
    margin: 0.25rem 0;
    color: #666;
  }

  .grand-total {
    font-weight: 600;
    color: #333;
    margin-top: 0.5rem !important;
  }

  .checkout-panel.complete {
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
    color: #666;
    font-family: monospace;
    margin-bottom: 1rem;
  }
</style>
