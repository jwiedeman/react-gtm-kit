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
    limit: '3.9 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-react',
    path: 'packages/react-modern/src/index.ts',
    import: '{ GtmProvider }',
    limit: '7 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-react-legacy',
    path: 'packages/react-legacy/src/index.ts',
    import: '{ withGtm }',
    limit: '7 KB'
  }),
  withDefaults({
    name: '@jwiedeman/gtm-kit-next',
    path: 'packages/next/src/index.ts',
    import: '{ useTrackPageViews }',
    limit: '14.5 KB'
  })
];
