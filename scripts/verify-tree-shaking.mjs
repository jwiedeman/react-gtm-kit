#!/usr/bin/env node
/**
 * Tree-shaking verification script
 * Tests that unused exports are properly eliminated during bundling
 */

import { build } from 'esbuild';
import { writeFileSync, unlinkSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const TEMP_ENTRY = join(rootDir, '_tree-shake-test.ts');

// Test cases: what to import and approximate expected bundle size
const CORE_TEST_CASES = [
  {
    name: 'Minimal import (createGtmClient only)',
    code: `import { createGtmClient } from './packages/core/src/index';
console.log(createGtmClient);`,
    // Client pulls in ScriptManager, dataLayer, consent, logging, retry mechanism - expected to be larger
    maxSizeKb: 26
  },
  {
    name: 'Events only',
    code: `import { pushEvent, pushEcommerce } from './packages/core/src/index';
console.log(pushEvent, pushEcommerce);`,
    // Events module should be well isolated
    maxSizeKb: 2
  },
  {
    name: 'Consent presets only',
    code: `import { getConsentPreset, eeaDefault, allGranted } from './packages/core/src/index';
console.log(getConsentPreset, eeaDefault, allGranted);`,
    // Consent presets are small objects
    maxSizeKb: 2
  },
  {
    name: 'Noscript only',
    code: `import { createNoscriptMarkup } from './packages/core/src/index';
console.log(createNoscriptMarkup);`,
    // Noscript is isolated utility
    maxSizeKb: 2
  },
  {
    name: 'URL utilities only',
    code: `import { buildGtmScriptUrl, normalizeContainer } from './packages/core/src/index';
console.log(buildGtmScriptUrl, normalizeContainer);`,
    // URL utilities are isolated
    maxSizeKb: 2
  },
  {
    name: 'Full import (baseline)',
    code: `export * from './packages/core/src/index';`,
    // Full library with all features including retry, partial load detection
    maxSizeKb: 32
  }
];

const ADAPTER_TEST_CASES = [
  {
    name: 'React: useGtm hook only',
    code: `import { useGtm } from './packages/react-modern/src/index';
console.log(useGtm);`,
    maxSizeKb: 20
  },
  {
    name: 'React: GtmProvider only',
    code: `import { GtmProvider } from './packages/react-modern/src/index';
console.log(GtmProvider);`,
    maxSizeKb: 27
  },
  {
    name: 'Vue: useGtm composable only',
    code: `import { useGtm } from './packages/vue/src/index';
console.log(useGtm);`,
    maxSizeKb: 20
  },
  {
    name: 'Svelte: createGtmStore only',
    code: `import { createGtmStore } from './packages/svelte/src/index';
console.log(createGtmStore);`,
    maxSizeKb: 27
  }
];

const TEST_CASES = [...CORE_TEST_CASES, ...ADAPTER_TEST_CASES];

async function testTreeShaking(testCase) {
  const { name, code, maxSizeKb } = testCase;

  // Write temporary entry file
  writeFileSync(TEMP_ENTRY, code);

  try {
    const result = await build({
      entryPoints: [TEMP_ENTRY],
      bundle: true,
      write: false,
      minify: true,
      treeShaking: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      external: ['react', 'vue', 'solid-js', 'svelte', 'svelte/store']
    });

    const bundleSize = result.outputFiles[0].text.length;
    const bundleSizeKb = bundleSize / 1024;
    const passed = bundleSizeKb <= maxSizeKb;

    return {
      name,
      bundleSizeKb: bundleSizeKb.toFixed(2),
      maxSizeKb,
      passed,
      message: passed
        ? `✓ ${name}: ${bundleSizeKb.toFixed(2)}KB (max: ${maxSizeKb}KB)`
        : `✗ ${name}: ${bundleSizeKb.toFixed(2)}KB exceeds max ${maxSizeKb}KB`
    };
  } finally {
    // Clean up temp file
    try {
      unlinkSync(TEMP_ENTRY);
    } catch {}
  }
}

async function main() {
  console.log('Tree-shaking verification\n');
  console.log('='.repeat(60));

  const results = [];

  for (const testCase of TEST_CASES) {
    const result = await testTreeShaking(testCase);
    results.push(result);
    console.log(result.message);
  }

  console.log('='.repeat(60));

  // Check that smaller imports are meaningfully smaller than full import
  const fullImport = results.find((r) => r.name.includes('Full import'));
  const minimalImport = results.find((r) => r.name.includes('Minimal import'));

  if (fullImport && minimalImport) {
    const fullSize = parseFloat(fullImport.bundleSizeKb);
    const minimalSize = parseFloat(minimalImport.bundleSizeKb);
    const reduction = (((fullSize - minimalSize) / fullSize) * 100).toFixed(1);

    console.log(`\nTree-shaking effectiveness:`);
    console.log(`  Full import: ${fullImport.bundleSizeKb}KB`);
    console.log(`  Minimal import: ${minimalImport.bundleSizeKb}KB`);
    console.log(`  Reduction: ${reduction}%`);

    if (parseFloat(reduction) < 20) {
      console.error('\n⚠ Warning: Tree-shaking reduction is less than 20%');
    } else {
      console.log('\n✓ Tree-shaking is working effectively');
    }
  }

  const allPassed = results.every((r) => r.passed);

  if (!allPassed) {
    console.error('\n✗ Some tree-shaking tests failed');
    process.exit(1);
  }

  console.log('\n✓ All tree-shaking tests passed');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
