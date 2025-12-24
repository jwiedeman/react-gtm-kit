module.exports = {
  branches: ['main', { name: 'next', channel: 'next', prerelease: 'rc' }],
  tagFormat: 'v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    // Root package - don't publish (private monorepo root)
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    // Convert workspace:* dependencies to actual versions before publishing
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node scripts/prepare-publish.mjs'
      }
    ],
    // Core package - must be published first (others depend on it)
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/core'
      }
    ],
    // React packages
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/react-modern'
      }
    ],
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/react-legacy'
      }
    ],
    // Meta-framework packages
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/next'
      }
    ],
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/remix'
      }
    ],
    // Vue ecosystem
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/vue'
      }
    ],
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/nuxt'
      }
    ],
    // Other frameworks
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/svelte'
      }
    ],
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/solid'
      }
    ],
    // CLI tool
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/cli'
      }
    ],
    // Astro integration
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/astro'
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'],
        message: 'chore(release): ${nextRelease.version}'
      }
    ],
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false,
        labels: false,
        releasedLabels: false
      }
    ]
  ]
};
