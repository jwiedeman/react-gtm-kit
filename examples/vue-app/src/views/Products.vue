<script setup lang="ts">
import { ref } from 'vue';
import { pushEcommerce } from '@react-gtm-kit/core';
import { useGtmClient } from '@react-gtm-kit/vue';

const client = useGtmClient();

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const products = ref<Product[]>([
  { id: 'SKU-001', name: 'Blue T-Shirt', price: 29.99, category: 'Clothing' },
  { id: 'SKU-002', name: 'Running Shoes', price: 89.99, category: 'Footwear' },
  { id: 'SKU-003', name: 'Wireless Headphones', price: 149.99, category: 'Electronics' },
  { id: 'SKU-004', name: 'Laptop Stand', price: 49.99, category: 'Accessories' }
]);

const cart = ref<Product[]>([]);

const addToCart = (product: Product) => {
  cart.value.push(product);

  // Track add_to_cart event using the ecommerce helper
  pushEcommerce(client, 'add_to_cart', {
    value: product.price,
    currency: 'USD',
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
        item_category: product.category
      }
    ]
  });
};

const viewProduct = (product: Product) => {
  // Track view_item event
  pushEcommerce(client, 'view_item', {
    value: product.price,
    currency: 'USD',
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
        item_category: product.category
      }
    ]
  });
};

const checkout = () => {
  if (cart.value.length === 0) return;

  const total = cart.value.reduce((sum, p) => sum + p.price, 0);

  // Track begin_checkout event
  pushEcommerce(client, 'begin_checkout', {
    value: total,
    currency: 'USD',
    items: cart.value.map((p) => ({
      item_id: p.id,
      item_name: p.name,
      price: p.price,
      quantity: 1,
      item_category: p.category
    }))
  });

  // Simulate purchase
  setTimeout(() => {
    pushEcommerce(client, 'purchase', {
      transaction_id: `T-${Date.now()}`,
      value: total,
      currency: 'USD',
      items: cart.value.map((p) => ({
        item_id: p.id,
        item_name: p.name,
        price: p.price,
        quantity: 1,
        item_category: p.category
      }))
    });

    cart.value = [];
    alert('Purchase complete! Check the dataLayer in console.');
  }, 500);
};
</script>

<template>
  <div class="products-page">
    <h1>Products</h1>
    <p class="subtitle">Click products to track view_item events. Add to cart to track add_to_cart events.</p>

    <div class="products-grid">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="viewProduct(product)"
      >
        <div class="product-image">{{ product.category.charAt(0) }}</div>
        <h3>{{ product.name }}</h3>
        <p class="price">${{ product.price.toFixed(2) }}</p>
        <p class="category">{{ product.category }}</p>
        <button @click.stop="addToCart(product)">Add to Cart</button>
      </div>
    </div>

    <div v-if="cart.length > 0" class="cart">
      <h2>Cart ({{ cart.length }} items)</h2>
      <ul>
        <li v-for="(item, index) in cart" :key="index">
          {{ item.name }} - ${{ item.price.toFixed(2) }}
        </li>
      </ul>
      <p class="cart-total">
        Total: ${{ cart.reduce((sum, p) => sum + p.price, 0).toFixed(2) }}
      </p>
      <button class="checkout-btn" @click="checkout">Checkout</button>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  padding: 1rem 0;
}

.products-page h1 {
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6c757d;
  margin-bottom: 2rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.product-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.product-card h3 {
  margin-bottom: 0.5rem;
}

.price {
  font-size: 1.25rem;
  font-weight: 600;
  color: #27ae60;
  margin-bottom: 0.25rem;
}

.category {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.product-card button {
  width: 100%;
  background: #3498db;
  color: white;
}

.cart {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.cart h2 {
  margin-bottom: 1rem;
}

.cart ul {
  list-style: none;
  margin-bottom: 1rem;
}

.cart li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.cart-total {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.checkout-btn {
  background: #27ae60;
  color: white;
  width: 100%;
  padding: 0.75rem;
  font-size: 1.125rem;
}
</style>
