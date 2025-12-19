/**
 * GTM Kit plugin for Nuxt 3
 *
 * This plugin initializes Google Tag Manager using GTM Kit.
 * The `.client.ts` suffix ensures this only runs on the client side.
 */
import { GtmPlugin, type GtmPluginOptions } from '@jwiedeman/gtm-kit-vue';
import { consentPresets } from '@jwiedeman/gtm-kit';

export default defineNuxtPlugin((nuxtApp) => {
  // Configure GTM options
  // Replace 'GTM-XXXXXX' with your actual GTM container ID
  const gtmOptions: GtmPluginOptions = {
    containers: 'GTM-NUXTAPP',
    dataLayerName: 'nuxtAppDataLayer',
    onBeforeInit: (client) => {
      // Set GDPR-compliant consent defaults for EU users
      client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
    }
  };

  // Install the Vue plugin on the Nuxt Vue app
  nuxtApp.vueApp.use(GtmPlugin, gtmOptions);
});
