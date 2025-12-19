<script setup lang="ts">
import { ref } from 'vue';
import { useGtmClient } from '@jwiedeman/gtm-kit-vue';
import { pushEcommerce } from '@jwiedeman/gtm-kit';

const client = useGtmClient();

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const products = ref<Product[]>([
  { id: 'NUXT-001', name: 'Nuxt T-Shirt', price: 34.99, category: 'Apparel' },
  { id: 'NUXT-002', name: 'Vue Hoodie', price: 69.99, category: 'Apparel' },
  { id: 'NUXT-003', name: 'TypeScript Mug', price: 19.99, category: 'Accessories' },
  { id: 'NUXT-004', name: 'Developer Stickers', price: 9.99, category: 'Accessories' }
]);

const addToCart = (product: Product) => {
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

  alert(`Added ${product.name} to cart! Check dataLayer in console.`);
};

useHead({
  title: 'Products - GTM Kit Nuxt Demo'
});
</script>

<template>
  <div class="products">
    <h1>Products</h1>
    <p class="subtitle">Ecommerce tracking with GTM Kit</p>

    <div class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="product-icon">{{ product.name.charAt(0) }}</div>
        <h3>{{ product.name }}</h3>
        <p class="price">${{ product.price.toFixed(2) }}</p>
        <p class="category">{{ product.category }}</p>
        <button @click="addToCart(product)">Add to Cart</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products h1 {
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
}

.product-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
}

.product-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #00dc82 0%, #0047e1 100%);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
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
  background: #00dc82;
  color: white;
}
</style>
