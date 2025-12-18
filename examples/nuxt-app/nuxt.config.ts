// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,
  typescript: {
    strict: true
  },
  app: {
    head: {
      title: 'GTM Kit - Nuxt Example',
      meta: [{ name: 'description', content: 'GTM Kit Nuxt 3 example application' }]
    }
  }
});
