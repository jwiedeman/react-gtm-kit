/**
 * Framework detection for GTM Kit CLI
 *
 * Auto-detects the framework being used by checking:
 * 1. package.json dependencies
 * 2. Config files (nuxt.config.ts, next.config.js, vite.config.ts)
 * 3. Directory structure
 */

import * as fs from 'fs';
import * as path from 'path';

export type Framework = 'next' | 'nuxt' | 'react' | 'vue' | 'vanilla';

export interface FrameworkInfo {
  /** Detected framework */
  framework: Framework;
  /** Framework version (if detectable) */
  version?: string;
  /** Package manager detected */
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  /** Packages to install */
  packages: string[];
  /** Human-readable framework name */
  displayName: string;
  /** Confidence score 0-100 */
  confidence: number;
  /** Reason for detection */
  reason: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
}

/**
 * Reads and parses package.json from the given directory
 */
const readPackageJson = (dir: string): PackageJson | null => {
  const pkgPath = path.join(dir, 'package.json');
  try {
    if (!fs.existsSync(pkgPath)) {
      return null;
    }
    const content = fs.readFileSync(pkgPath, 'utf-8');
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
};

/**
 * Checks if a file exists in the given directory
 */
const fileExists = (dir: string, filename: string): boolean => {
  return fs.existsSync(path.join(dir, filename));
};

/**
 * Gets the version of a dependency from package.json
 */
const getDependencyVersion = (pkg: PackageJson, name: string): string | undefined => {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
};

/**
 * Detects which package manager is being used
 */
const detectPackageManager = (dir: string, pkg: PackageJson | null): FrameworkInfo['packageManager'] => {
  // Check lockfiles first (most reliable)
  if (fileExists(dir, 'pnpm-lock.yaml')) return 'pnpm';
  if (fileExists(dir, 'yarn.lock')) return 'yarn';
  if (fileExists(dir, 'bun.lockb')) return 'bun';
  if (fileExists(dir, 'package-lock.json')) return 'npm';

  // Check packageManager field in package.json
  if (pkg?.packageManager) {
    if (pkg.packageManager.startsWith('pnpm')) return 'pnpm';
    if (pkg.packageManager.startsWith('yarn')) return 'yarn';
    if (pkg.packageManager.startsWith('bun')) return 'bun';
  }

  // Default to npm
  return 'npm';
};

/**
 * Get install command for package manager
 */
export const getInstallCommand = (packageManager: FrameworkInfo['packageManager'], packages: string[]): string => {
  const pkgList = packages.join(' ');
  switch (packageManager) {
    case 'pnpm':
      return `pnpm add ${pkgList}`;
    case 'yarn':
      return `yarn add ${pkgList}`;
    case 'bun':
      return `bun add ${pkgList}`;
    case 'npm':
    default:
      return `npm install ${pkgList}`;
  }
};

/**
 * Detects the framework being used in the given directory
 */
export const detectFramework = (dir: string = process.cwd()): FrameworkInfo => {
  const pkg = readPackageJson(dir);
  const packageManager = detectPackageManager(dir, pkg);

  // Check for Nuxt (highest priority - it's built on Vue)
  if (pkg && getDependencyVersion(pkg, 'nuxt')) {
    const version = getDependencyVersion(pkg, 'nuxt');
    return {
      framework: 'nuxt',
      version: version?.replace(/^\^|~/, ''),
      packageManager,
      packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-nuxt'],
      displayName: 'Nuxt 3',
      confidence: 100,
      reason: 'Found "nuxt" in dependencies'
    };
  }

  // Check for Nuxt config files
  if (fileExists(dir, 'nuxt.config.ts') || fileExists(dir, 'nuxt.config.js')) {
    return {
      framework: 'nuxt',
      packageManager,
      packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-nuxt'],
      displayName: 'Nuxt 3',
      confidence: 95,
      reason: 'Found nuxt.config file'
    };
  }

  // Check for Next.js (higher priority than React - it's built on React)
  if (pkg && getDependencyVersion(pkg, 'next')) {
    const version = getDependencyVersion(pkg, 'next');
    return {
      framework: 'next',
      version: version?.replace(/^\^|~/, ''),
      packageManager,
      packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-next'],
      displayName: 'Next.js',
      confidence: 100,
      reason: 'Found "next" in dependencies'
    };
  }

  // Check for Next.js config files
  if (fileExists(dir, 'next.config.js') || fileExists(dir, 'next.config.mjs') || fileExists(dir, 'next.config.ts')) {
    return {
      framework: 'next',
      packageManager,
      packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-next'],
      displayName: 'Next.js',
      confidence: 90,
      reason: 'Found next.config file'
    };
  }

  // Check for Vue (but not Nuxt)
  if (pkg && getDependencyVersion(pkg, 'vue')) {
    const version = getDependencyVersion(pkg, 'vue');
    return {
      framework: 'vue',
      version: version?.replace(/^\^|~/, ''),
      packageManager,
      packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-vue'],
      displayName: 'Vue 3',
      confidence: 100,
      reason: 'Found "vue" in dependencies'
    };
  }

  // Check for Vite with Vue
  if (fileExists(dir, 'vite.config.ts') || fileExists(dir, 'vite.config.js')) {
    const viteConfig = path.join(dir, fileExists(dir, 'vite.config.ts') ? 'vite.config.ts' : 'vite.config.js');
    try {
      const content = fs.readFileSync(viteConfig, 'utf-8');
      if (content.includes('@vitejs/plugin-vue') || content.includes('vue()')) {
        return {
          framework: 'vue',
          packageManager,
          packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-vue'],
          displayName: 'Vue 3 (Vite)',
          confidence: 85,
          reason: 'Found Vue plugin in vite.config'
        };
      }
    } catch (error) {
      // Debug: Log read errors for vite config (non-critical)
      if (process.env.DEBUG) {
        console.debug(`[gtm-kit] Could not read ${viteConfig}:`, error);
      }
    }
  }

  // Check for React
  if (pkg && getDependencyVersion(pkg, 'react')) {
    const version = getDependencyVersion(pkg, 'react');
    const majorVersion = parseInt(version?.replace(/^\^|~/, '').split('.')[0] ?? '18', 10);

    // React 16.8+ supports hooks, recommend modern package
    if (majorVersion >= 16) {
      return {
        framework: 'react',
        version: version?.replace(/^\^|~/, ''),
        packageManager,
        packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-react'],
        displayName: majorVersion >= 18 ? 'React 18+' : 'React 16.8+',
        confidence: 100,
        reason: 'Found "react" in dependencies'
      };
    }

    // Older React - use legacy package
    return {
      framework: 'react',
      version: version?.replace(/^\^|~/, ''),
      packageManager,
      packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-react-legacy'],
      displayName: 'React (Legacy)',
      confidence: 100,
      reason: 'Found older "react" version in dependencies'
    };
  }

  // Check for .jsx/.tsx files suggesting React
  const srcDir = path.join(dir, 'src');
  if (fs.existsSync(srcDir)) {
    try {
      const files = fs.readdirSync(srcDir);
      if (files.some((f) => f.endsWith('.jsx') || f.endsWith('.tsx'))) {
        return {
          framework: 'react',
          packageManager,
          packages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-react'],
          displayName: 'React (detected from .jsx/.tsx files)',
          confidence: 70,
          reason: 'Found .jsx or .tsx files in src/'
        };
      }
    } catch (error) {
      // Debug: Log read errors for src directory (non-critical)
      if (process.env.DEBUG) {
        console.debug(`[gtm-kit] Could not read ${srcDir}:`, error);
      }
    }
  }

  // Default to vanilla JS
  return {
    framework: 'vanilla',
    packageManager,
    packages: ['@jwiedeman/gtm-kit'],
    displayName: 'Vanilla JavaScript',
    confidence: 50,
    reason: 'No framework detected, using core package only'
  };
};

/**
 * Human-readable summary of detected framework
 */
export const getDetectionSummary = (info: FrameworkInfo): string => {
  const lines = [
    `Framework: ${info.displayName}`,
    `Package Manager: ${info.packageManager}`,
    `Confidence: ${info.confidence}%`,
    `Reason: ${info.reason}`,
    '',
    'Packages to install:',
    ...info.packages.map((p) => `  - ${p}`)
  ];

  if (info.version) {
    lines.splice(1, 0, `Version: ${info.version}`);
  }

  return lines.join('\n');
};
