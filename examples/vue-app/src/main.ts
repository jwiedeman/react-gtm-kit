import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { GtmPlugin, type GtmPluginOptions } from '@react-gtm-kit/vue';
import { consentPresets } from '@react-gtm-kit/core';
import App from './App.vue';
import Home from './views/Home.vue';
import Products from './views/Products.vue';
import About from './views/About.vue';

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/products', name: 'products', component: Products },
    { path: '/about', name: 'about', component: About }
  ]
});

// Create app
const app = createApp(App);

// Configure GTM
// Replace 'GTM-XXXXXX' with your actual GTM container ID
const gtmOptions: GtmPluginOptions = {
  containers: 'GTM-VUEAPP',
  dataLayerName: 'vueAppDataLayer',
  onBeforeInit: (client) => {
    // Set GDPR-compliant consent defaults for EU users
    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
  }
};

// Install plugins
app.use(router);
app.use(GtmPlugin, gtmOptions);

// Mount app
app.mount('#app');
