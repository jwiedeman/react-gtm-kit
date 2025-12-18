/**
 * GTM Kit CLI - Zero-config installation for Google Tag Manager
 *
 * Features:
 * - Auto-detects your framework (React, Next.js, Vue, Nuxt, Vanilla)
 * - Installs the right packages automatically
 * - Generates starter code for your setup
 * - Validates your GTM container ID format
 */

export { detectFramework, type FrameworkInfo } from './detect';
export { validateGtmId, validateConfig, type ValidationResult } from './validate';
export { generateSetupCode, type SetupCodeOptions } from './codegen';
export { run } from './cli';
