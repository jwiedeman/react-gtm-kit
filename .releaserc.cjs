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
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/core'
      }
    ],
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
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'packages/next'
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml', 'packages/*/package.json'],
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
