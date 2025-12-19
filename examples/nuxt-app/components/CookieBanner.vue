<script setup lang="ts">
import { ref } from 'vue';
import { useGtmConsent } from '@jwiedeman/gtm-kit-vue';

const { updateConsent } = useGtmConsent();
const isVisible = ref(true);

const acceptAll = () => {
  updateConsent({
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  });
  isVisible.value = false;
};

const rejectAll = () => {
  updateConsent({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  isVisible.value = false;
};
</script>

<template>
  <ClientOnly>
    <div v-if="isVisible" class="cookie-banner">
      <div class="cookie-content">
        <p>We use cookies for analytics. Choose your preference:</p>
        <div class="cookie-buttons">
          <button class="btn-accept" @click="acceptAll">Accept</button>
          <button class="btn-reject" @click="rejectAll">Reject</button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.cookie-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-accept {
  background: #27ae60;
  color: white;
}

.btn-reject {
  background: #7f8c8d;
  color: white;
}
</style>
