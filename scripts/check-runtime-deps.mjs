import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const checks = [
  {
    name: '@react-gtm-kit/core',
    manifest: 'packages/core/package.json',
    allow: []
  },
  {
    name: '@react-gtm-kit/react-modern',
    manifest: 'packages/react-modern/package.json',
    allow: ['@react-gtm-kit/core']
  },
  {
    name: '@react-gtm-kit/react-legacy',
    manifest: 'packages/react-legacy/package.json',
    allow: ['@react-gtm-kit/core']
  },
  {
    name: '@react-gtm-kit/next',
    manifest: 'packages/next/package.json',
    allow: ['@react-gtm-kit/core']
  }
];

const errors = [];

for (const check of checks) {
  const manifestPath = path.join(repoRoot, check.manifest);
  const manifestRaw = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  const dependencies = manifest.dependencies ?? {};
  const runtimeDeps = Object.keys(dependencies);

  const unexpected = runtimeDeps.filter((dep) => !check.allow.includes(dep));
  if (unexpected.length > 0) {
    errors.push(
      `${check.name} has unexpected runtime dependencies: ${unexpected.join(', ')} (allowed: ${
        check.allow.length ? check.allow.join(', ') : 'none'
      })`
    );
  }

  const missing = check.allow.filter((dep) => !runtimeDeps.includes(dep));
  if (missing.length > 0) {
    errors.push(`${check.name} is missing required runtime dependencies: ${missing.join(', ')}`);
  }
}

if (errors.length > 0) {
  for (const message of errors) {
    console.error(`❌ ${message}`);
  }
  process.exitCode = 1;
  process.exit();
}

console.log('✅ Runtime dependency check passed.');
