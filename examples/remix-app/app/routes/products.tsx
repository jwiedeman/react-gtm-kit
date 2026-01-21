import { useState, useMemo, useEffect } from 'react';
import { useGtmPush } from '@jwiedeman/gtm-kit-remix';

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

type CheckoutStep = 'browse' | 'cart' | 'shipping' | 'payment' | 'complete';

export default function Products() {
  const push = useGtmPush();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('browse');
  const [lastOrderId, setLastOrderId] = useState('');

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

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
    push({ event, ecommerce });
  };

  useEffect(() => {
    // Track view_item_list on page load
    pushEcommerce('view_item_list', {
      item_list_id: 'products_main',
      item_list_name: 'Products Page',
      items: products.map((p, i) => toGA4Item(p, 1, i))
    });
  }, []);

  const viewProduct = (product: Product, index: number) => {
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
  };

  const addToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    pushEcommerce('add_to_cart', {
      currency: 'USD',
      value: product.price,
      items: [toGA4Item(product)]
    });
  };

  const removeFromCart = (item: CartItem) => {
    pushEcommerce('remove_from_cart', {
      currency: 'USD',
      value: item.price * item.quantity,
      items: [toGA4Item(item, item.quantity)]
    });
    setCart((prev) => prev.filter((i) => i.id !== item.id));
  };

  const viewCart = () => {
    setCheckoutStep('cart');
    pushEcommerce('view_cart', {
      currency: 'USD',
      value: cartTotal,
      items: cart.map((item, i) => toGA4Item(item, item.quantity, i))
    });
  };

  const beginCheckout = () => {
    pushEcommerce('begin_checkout', {
      currency: 'USD',
      value: cartTotal,
      items: cart.map((item) => toGA4Item(item, item.quantity))
    });
    setCheckoutStep('shipping');
  };

  const addShipping = () => {
    pushEcommerce('add_shipping_info', {
      currency: 'USD',
      value: cartTotal,
      shipping_tier: 'Standard',
      items: cart.map((item) => toGA4Item(item, item.quantity))
    });
    setCheckoutStep('payment');
  };

  const addPayment = () => {
    pushEcommerce('add_payment_info', {
      currency: 'USD',
      value: cartTotal,
      payment_type: 'Credit Card',
      items: cart.map((item) => toGA4Item(item, item.quantity))
    });
    completePurchase();
  };

  const completePurchase = () => {
    const orderId = `TXN-${Date.now()}`;
    setLastOrderId(orderId);
    pushEcommerce('purchase', {
      transaction_id: orderId,
      currency: 'USD',
      value: cartTotal,
      tax: cartTotal * 0.08,
      shipping: 5.99,
      items: cart.map((item) => toGA4Item(item, item.quantity))
    });
    setCart([]);
    setCheckoutStep('complete');
  };

  const requestRefund = () => {
    pushEcommerce('refund', {
      transaction_id: lastOrderId,
      currency: 'USD',
      value: 0
    });
    push({ event: 'refund_requested', order_id: lastOrderId });
    setLastOrderId('');
    setCheckoutStep('browse');
  };

  const styles = {
    page: { padding: '1rem 0' },
    header: { marginBottom: '2rem' },
    h1: { margin: '0 0 0.5rem' },
    description: { color: '#666', fontSize: '0.875rem', marginBottom: '1rem' },
    cartBtn: {
      background: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
    card: {
      background: 'white',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '1.25rem',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    productImage: {
      width: '50px',
      height: '50px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem',
      fontWeight: 'bold' as const,
      marginBottom: '0.75rem'
    },
    cardH3: { margin: '0 0 0.25rem', fontSize: '1rem' },
    brand: { color: '#6c757d', fontSize: '0.8rem', margin: '0 0 0.25rem' },
    price: { fontSize: '1.125rem', fontWeight: 600 as const, color: '#27ae60', margin: '0 0 0.25rem' },
    category: { color: '#6c757d', fontSize: '0.75rem', margin: '0 0 0.75rem' },
    cardButton: {
      width: '100%',
      background: '#3498db',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.875rem'
    },
    checkoutPanel: { background: '#f8f9fa', padding: '2rem', borderRadius: '8px', maxWidth: '500px' },
    cartItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      background: 'white',
      borderRadius: '4px',
      marginBottom: '0.5rem'
    },
    removeBtn: {
      background: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.75rem'
    },
    cartSummary: { marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid #e9ecef' },
    total: { fontSize: '1.25rem', fontWeight: 600 as const, marginBottom: '1rem' },
    buttonRow: { display: 'flex', gap: '0.5rem' },
    primary: {
      flex: 1,
      background: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    secondary: {
      flex: 1,
      background: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    danger: {
      flex: 1,
      background: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    formMock: { background: 'white', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' },
    formMockP: { margin: '0.25rem 0', color: '#666' },
    grandTotal: { fontWeight: 600 as const, color: '#333', marginTop: '0.5rem' },
    completePanel: {
      background: '#f8f9fa',
      padding: '2rem',
      borderRadius: '8px',
      maxWidth: '500px',
      textAlign: 'center' as const
    },
    successIcon: {
      width: '80px',
      height: '80px',
      background: '#27ae60',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2.5rem',
      margin: '0 auto 1rem'
    },
    orderId: { color: '#666', fontFamily: 'monospace', marginBottom: '1rem' }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Products</h1>
        <p style={styles.description}>
          Full e-commerce tracking: view_item_list, select_item, view_item, add_to_cart, remove_from_cart, view_cart,
          begin_checkout, add_shipping_info, add_payment_info, purchase, refund
        </p>
        {cartCount > 0 && checkoutStep === 'browse' && (
          <button style={styles.cartBtn} onClick={viewCart}>
            View Cart ({cartCount})
          </button>
        )}
      </div>

      {checkoutStep === 'browse' && (
        <div style={styles.grid}>
          {products.map((product, index) => (
            <div key={product.id} style={styles.card} onClick={() => viewProduct(product, index)}>
              <div style={styles.productImage}>{product.brand.charAt(0)}</div>
              <h3 style={styles.cardH3}>{product.name}</h3>
              <p style={styles.brand}>{product.brand}</p>
              <p style={styles.price}>${product.price.toFixed(2)}</p>
              <p style={styles.category}>{product.category}</p>
              <button style={styles.cardButton} onClick={(e) => addToCart(product, e)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}

      {checkoutStep === 'cart' && (
        <div style={styles.checkoutPanel}>
          <h2>Your Cart</h2>
          {cart.map((item) => (
            <div key={item.id} style={styles.cartItem}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem' }}>{item.name}</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                  Qty: {item.quantity} × ${item.price.toFixed(2)}
                </p>
              </div>
              <button style={styles.removeBtn} onClick={() => removeFromCart(item)}>
                Remove
              </button>
            </div>
          ))}
          <div style={styles.cartSummary}>
            <p style={styles.total}>Total: ${cartTotal.toFixed(2)}</p>
            <div style={styles.buttonRow}>
              <button style={styles.secondary} onClick={() => setCheckoutStep('browse')}>
                Continue Shopping
              </button>
              <button style={styles.primary} onClick={beginCheckout}>
                Begin Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutStep === 'shipping' && (
        <div style={styles.checkoutPanel}>
          <h2>Shipping (Step 1/2)</h2>
          <div style={styles.formMock}>
            <p style={styles.formMockP}>Address: 123 Main St, City, ST 12345</p>
            <p style={styles.formMockP}>Method: Standard Shipping ($5.99)</p>
          </div>
          <button style={styles.primary} onClick={addShipping}>
            Continue to Payment
          </button>
        </div>
      )}

      {checkoutStep === 'payment' && (
        <div style={styles.checkoutPanel}>
          <h2>Payment (Step 2/2)</h2>
          <div style={styles.formMock}>
            <p style={styles.formMockP}>Card: **** **** **** 4242</p>
            <p style={styles.formMockP}>Subtotal: ${cartTotal.toFixed(2)}</p>
            <p style={styles.formMockP}>Tax (8%): ${(cartTotal * 0.08).toFixed(2)}</p>
            <p style={styles.formMockP}>Shipping: $5.99</p>
            <p style={{ ...styles.formMockP, ...styles.grandTotal }}>Total: ${(cartTotal * 1.08 + 5.99).toFixed(2)}</p>
          </div>
          <button style={styles.primary} onClick={addPayment}>
            Complete Purchase
          </button>
        </div>
      )}

      {checkoutStep === 'complete' && (
        <div style={styles.completePanel}>
          <div style={styles.successIcon}>✓</div>
          <h2>Order Complete!</h2>
          <p style={styles.orderId}>{lastOrderId}</p>
          <div style={styles.buttonRow}>
            <button style={styles.danger} onClick={requestRefund}>
              Request Refund
            </button>
            <button style={styles.primary} onClick={() => setCheckoutStep('browse')}>
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
