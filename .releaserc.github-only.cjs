// Release configuration for GitHub releases only (no npm publishing)
// Used when NPM_TOKEN is not available
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
