const withDefaults = (config) => ({
  gzip: true,
  brotli: false,
  ...config
});

module.exports = [
  withDefaults({
    name: '@jwiedeman/gtm-kit',
    path: 'packages/core/src/index.ts',
    import: '{ createGtmClient }',
    limit: '4 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-react',
    path: 'packages/react-modern/src/index.ts',
    import: '{ GtmProvider }',
    limit: '7.5 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-react-legacy',
    path: 'packages/react-legacy/src/index.ts',
    import: '{ withGtm }',
    limit: '7.5 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-vue',
    path: 'packages/vue/src/index.ts',
    import: '{ GtmPlugin }',
    limit: '4.5 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-next',
    path: 'packages/next/src/index.ts',
    import: '{ useTrackPageViews }',
    limit: '15 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-nuxt',
    path: 'packages/nuxt/src/index.ts',
    import: '{ useTrackPageViews }',
    limit: '9 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-svelte',
    path: 'packages/svelte/src/index.ts',
    import: '{ createGtmStore }',
    limit: '6 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-solid',
    path: 'packages/solid/src/index.ts',
    import: '{ GtmProvider }',
    limit: '8 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-remix',
    path: 'packages/remix/src/index.ts',
    import: '{ GtmProvider }',
    limit: '7.5 KB'
  })
];
