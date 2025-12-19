#!/usr/bin/env node
/**
 * Prepares packages for npm publishing by converting workspace:* dependencies
 * to actual version numbers.
 *
 * This script is run as part of the semantic-release prepare phase.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Packages that have workspace dependencies
const packagesWithDeps = ['react-modern', 'react-legacy', 'next', 'remix', 'vue', 'nuxt', 'svelte', 'solid'];

// Map of workspace package names to their directories
const packageMap = {
  '@jwiedeman/gtm-kit': 'core',
  '@jwiedeman/gtm-kit-vue': 'vue'
};

function getPackageVersion(packageDir) {
  const pkgPath = join(rootDir, 'packages', packageDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

function updatePackageDeps(packageDir) {
  const pkgPath = join(rootDir, 'packages', packageDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  let modified = false;

  if (pkg.dependencies) {
    for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
      if (depVersion === 'workspace:*') {
        const depDir = packageMap[depName];
        if (depDir) {
          const actualVersion = getPackageVersion(depDir);
          pkg.dependencies[depName] = `^${actualVersion}`;
          console.log(`  ${depName}: workspace:* -> ^${actualVersion}`);
          modified = true;
        }
      }
    }
  }

  if (modified) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  return modified;
}

console.log('Preparing packages for npm publish...\n');

for (const packageDir of packagesWithDeps) {
  console.log(`Processing packages/${packageDir}:`);
  const modified = updatePackageDeps(packageDir);
  if (!modified) {
    console.log('  No workspace:* dependencies found');
  }
  console.log('');
}

console.log('Done!');
