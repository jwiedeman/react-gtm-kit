module.exports = [
  {
    name: '@react-gtm-kit/core',
    path: 'packages/core/src/index.ts',
    import: '{ createGtmClient }',
    limit: '3 KB'
  },
  {
    name: '@react-gtm-kit/react-modern',
    path: 'packages/react-modern/src/index.ts',
    import: '{ GtmProvider }',
    limit: '6 KB'
  },
  {
    name: '@react-gtm-kit/react-legacy',
    path: 'packages/react-legacy/src/index.ts',
    import: '{ withGtm }',
    limit: '6 KB'
  },
  {
    name: '@react-gtm-kit/next',
    path: 'packages/next/src/index.ts',
    import: '{ useTrackPageViews }',
    limit: '12 KB'
  }
];
