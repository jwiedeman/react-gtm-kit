/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectFramework, getInstallCommand, getDetectionSummary } from '../detect';

describe('detectFramework', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtm-kit-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const writePackageJson = (deps: Record<string, string> = {}, devDeps: Record<string, string> = {}) => {
    const pkg = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: deps,
      devDependencies: devDeps
    };
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));
  };

  const writeLockfile = (name: string) => {
    fs.writeFileSync(path.join(tempDir, name), '');
  };

  const writeConfigFile = (name: string, content = '') => {
    fs.writeFileSync(path.join(tempDir, name), content);
  };

  describe('Nuxt detection', () => {
    it('detects Nuxt from dependencies', () => {
      writePackageJson({ nuxt: '^3.11.0', vue: '^3.4.0' });

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('nuxt');
      expect(result.displayName).toBe('Nuxt 3');
      expect(result.confidence).toBe(100);
      expect(result.packages).toContain('@react-gtm-kit/nuxt');
    });

    it('detects Nuxt from config file', () => {
      writePackageJson({});
      writeConfigFile('nuxt.config.ts');

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('nuxt');
      expect(result.confidence).toBe(95);
    });

    it('detects Nuxt from .js config file', () => {
      writePackageJson({});
      writeConfigFile('nuxt.config.js');

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('nuxt');
    });

    it('extracts Nuxt version', () => {
      writePackageJson({ nuxt: '^3.11.2' });

      const result = detectFramework(tempDir);

      expect(result.version).toBe('3.11.2');
    });
  });

  describe('Next.js detection', () => {
    it('detects Next.js from dependencies', () => {
      writePackageJson({ next: '^14.0.0', react: '^18.2.0' });

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('next');
      expect(result.displayName).toBe('Next.js');
      expect(result.confidence).toBe(100);
      expect(result.packages).toContain('@react-gtm-kit/next');
    });

    it('detects Next.js from config file', () => {
      writePackageJson({ react: '^18.0.0' });
      writeConfigFile('next.config.js');

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('next');
      expect(result.confidence).toBe(90);
    });

    it('detects Next.js from .mjs config file', () => {
      writePackageJson({});
      writeConfigFile('next.config.mjs');

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('next');
    });

    it('detects Next.js from .ts config file', () => {
      writePackageJson({});
      writeConfigFile('next.config.ts');

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('next');
    });
  });

  describe('Vue detection', () => {
    it('detects Vue from dependencies', () => {
      writePackageJson({ vue: '^3.4.0' });

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('vue');
      expect(result.displayName).toBe('Vue 3');
      expect(result.confidence).toBe(100);
      expect(result.packages).toContain('@react-gtm-kit/vue');
    });

    it('extracts Vue version', () => {
      writePackageJson({ vue: '~3.3.4' });

      const result = detectFramework(tempDir);

      expect(result.version).toBe('3.3.4');
    });

    it('detects Vue from Vite config with Vue plugin', () => {
      writePackageJson({});
      writeConfigFile(
        'vite.config.ts',
        `
        import vue from '@vitejs/plugin-vue';
        export default { plugins: [vue()] };
      `
      );

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('vue');
      expect(result.displayName).toContain('Vite');
      expect(result.confidence).toBe(85);
    });
  });

  describe('React detection', () => {
    it('detects React 18+ from dependencies', () => {
      writePackageJson({ react: '^18.2.0' });

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('react');
      expect(result.displayName).toBe('React 18+');
      expect(result.confidence).toBe(100);
      expect(result.packages).toContain('@react-gtm-kit/react-modern');
    });

    it('detects React 16.8+ from dependencies', () => {
      writePackageJson({ react: '^16.8.0' });

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('react');
      expect(result.displayName).toBe('React 16.8+');
      expect(result.packages).toContain('@react-gtm-kit/react-modern');
    });

    it('detects older React and recommends legacy package', () => {
      writePackageJson({ react: '^15.0.0' });

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('react');
      expect(result.displayName).toContain('Legacy');
      expect(result.packages).toContain('@react-gtm-kit/react-legacy');
    });

    it('detects React from .jsx files in src/', () => {
      writePackageJson({});
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'App.jsx'), '');

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('react');
      expect(result.confidence).toBe(70);
    });

    it('detects React from .tsx files in src/', () => {
      writePackageJson({});
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'App.tsx'), '');

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('react');
    });
  });

  describe('Vanilla detection', () => {
    it('defaults to vanilla when no framework detected', () => {
      writePackageJson({});

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('vanilla');
      expect(result.displayName).toBe('Vanilla JavaScript');
      expect(result.confidence).toBe(50);
      expect(result.packages).toEqual(['@react-gtm-kit/core']);
    });

    it('returns vanilla for empty directory', () => {
      const result = detectFramework(tempDir);

      expect(result.framework).toBe('vanilla');
    });
  });

  describe('Package manager detection', () => {
    it('detects pnpm from lockfile', () => {
      writePackageJson({});
      writeLockfile('pnpm-lock.yaml');

      const result = detectFramework(tempDir);

      expect(result.packageManager).toBe('pnpm');
    });

    it('detects yarn from lockfile', () => {
      writePackageJson({});
      writeLockfile('yarn.lock');

      const result = detectFramework(tempDir);

      expect(result.packageManager).toBe('yarn');
    });

    it('detects npm from lockfile', () => {
      writePackageJson({});
      writeLockfile('package-lock.json');

      const result = detectFramework(tempDir);

      expect(result.packageManager).toBe('npm');
    });

    it('detects bun from lockfile', () => {
      writePackageJson({});
      writeLockfile('bun.lockb');

      const result = detectFramework(tempDir);

      expect(result.packageManager).toBe('bun');
    });

    it('detects from packageManager field', () => {
      const pkg = {
        name: 'test',
        packageManager: 'pnpm@8.15.4'
      };
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));

      const result = detectFramework(tempDir);

      expect(result.packageManager).toBe('pnpm');
    });

    it('defaults to npm', () => {
      writePackageJson({});

      const result = detectFramework(tempDir);

      expect(result.packageManager).toBe('npm');
    });
  });

  describe('Framework priority', () => {
    it('prioritizes Nuxt over Vue', () => {
      writePackageJson({ nuxt: '^3.0.0', vue: '^3.0.0' });

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('nuxt');
    });

    it('prioritizes Next.js over React', () => {
      writePackageJson({ next: '^14.0.0', react: '^18.0.0' });

      const result = detectFramework(tempDir);

      expect(result.framework).toBe('next');
    });
  });
});

describe('getInstallCommand', () => {
  const packages = ['@react-gtm-kit/core', '@react-gtm-kit/react-modern'];

  it('generates npm command', () => {
    expect(getInstallCommand('npm', packages)).toBe(
      'npm install @react-gtm-kit/core @react-gtm-kit/react-modern'
    );
  });

  it('generates yarn command', () => {
    expect(getInstallCommand('yarn', packages)).toBe(
      'yarn add @react-gtm-kit/core @react-gtm-kit/react-modern'
    );
  });

  it('generates pnpm command', () => {
    expect(getInstallCommand('pnpm', packages)).toBe(
      'pnpm add @react-gtm-kit/core @react-gtm-kit/react-modern'
    );
  });

  it('generates bun command', () => {
    expect(getInstallCommand('bun', packages)).toBe(
      'bun add @react-gtm-kit/core @react-gtm-kit/react-modern'
    );
  });
});

describe('getDetectionSummary', () => {
  it('formats detection summary correctly', () => {
    const info = {
      framework: 'react' as const,
      version: '18.2.0',
      packageManager: 'npm' as const,
      packages: ['@react-gtm-kit/core', '@react-gtm-kit/react-modern'],
      displayName: 'React 18+',
      confidence: 100,
      reason: 'Found "react" in dependencies'
    };

    const summary = getDetectionSummary(info);

    expect(summary).toContain('React 18+');
    expect(summary).toContain('18.2.0');
    expect(summary).toContain('npm');
    expect(summary).toContain('100%');
    expect(summary).toContain('@react-gtm-kit/core');
    expect(summary).toContain('@react-gtm-kit/react-modern');
  });
});
