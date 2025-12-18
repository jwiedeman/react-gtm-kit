/**
 * @jest-environment node
 */
import { generateSetupCode, formatGeneratedCode } from '../codegen';

describe('generateSetupCode', () => {
  describe('Next.js generation', () => {
    it('generates TypeScript Next.js setup', () => {
      const files = generateSetupCode({
        framework: 'next',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      expect(files).toHaveLength(3);
      expect(files[0].filename).toContain('gtm-provider.tsx');
      expect(files[0].content).toContain("'use client'");
      expect(files[0].content).toContain('GTM-ABC1234');
      expect(files[0].content).toContain('GtmProvider');
      expect(files[0].content).toContain('useTrackPageViews');
    });

    it('generates JavaScript Next.js setup', () => {
      const files = generateSetupCode({
        framework: 'next',
        containers: 'GTM-ABC1234',
        typescript: false
      });

      expect(files[0].filename).toContain('.jsx');
      expect(files[0].content).not.toContain('ReactNode');
    });

    it('includes consent setup when requested', () => {
      const files = generateSetupCode({
        framework: 'next',
        containers: 'GTM-ABC1234',
        typescript: true,
        includeConsent: true
      });

      expect(files[0].content).toContain('eeaDefault');
      expect(files[0].content).toContain('consentDefaults');
    });

    it('handles multiple containers', () => {
      const files = generateSetupCode({
        framework: 'next',
        containers: ['GTM-ABC1234', 'GTM-XYZ5678'],
        typescript: true
      });

      expect(files[0].content).toContain("'GTM-ABC1234'");
      expect(files[0].content).toContain("'GTM-XYZ5678'");
    });
  });

  describe('Nuxt generation', () => {
    it('generates TypeScript Nuxt setup', () => {
      const files = generateSetupCode({
        framework: 'nuxt',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      expect(files.length).toBeGreaterThanOrEqual(3);
      expect(files[0].filename).toContain('plugins/gtm.client.ts');
      expect(files[0].content).toContain('createNuxtGtmPlugin');
      expect(files[0].content).toContain('GTM-ABC1234');
    });

    it('generates page tracking composable', () => {
      const files = generateSetupCode({
        framework: 'nuxt',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      const trackingFile = files.find((f) => f.filename.includes('usePageTracking'));
      expect(trackingFile).toBeDefined();
      expect(trackingFile!.content).toContain('useTrackPageViews');
    });

    it('generates app.vue with page tracking', () => {
      const files = generateSetupCode({
        framework: 'nuxt',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      const appFile = files.find((f) => f.filename === 'app.vue');
      expect(appFile).toBeDefined();
      expect(appFile!.content).toContain('usePageTracking');
    });
  });

  describe('React generation', () => {
    it('generates TypeScript React setup', () => {
      const files = generateSetupCode({
        framework: 'react',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      expect(files.length).toBeGreaterThanOrEqual(2);
      expect(files[0].filename).toContain('App.tsx');
      expect(files[0].content).toContain('GtmProvider');
    });

    it('generates React Router setup file', () => {
      const files = generateSetupCode({
        framework: 'react',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      const routerFile = files.find((f) => f.filename.includes('Router'));
      expect(routerFile).toBeDefined();
      expect(routerFile!.content).toContain('BrowserRouter');
      expect(routerFile!.content).toContain('PageViewTracker');
    });

    it('generates example tracking components', () => {
      const files = generateSetupCode({
        framework: 'react',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      const exampleFile = files.find((f) => f.filename.includes('TrackingExample'));
      expect(exampleFile).toBeDefined();
      expect(exampleFile!.content).toContain('useGtmPush');
      expect(exampleFile!.content).toContain('button_click');
    });
  });

  describe('Vue generation', () => {
    it('generates TypeScript Vue setup', () => {
      const files = generateSetupCode({
        framework: 'vue',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      expect(files.length).toBeGreaterThanOrEqual(3);
      expect(files[0].filename).toContain('main.ts');
      expect(files[0].content).toContain('GtmPlugin');
      expect(files[0].content).toContain('GTM-ABC1234');
    });

    it('generates router tracking composable', () => {
      const files = generateSetupCode({
        framework: 'vue',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      const routerFile = files.find((f) => f.filename.includes('router-tracking'));
      expect(routerFile).toBeDefined();
      expect(routerFile!.content).toContain('useRoute');
      expect(routerFile!.content).toContain('useGtmPush');
    });

    it('generates Vue SFC example', () => {
      const files = generateSetupCode({
        framework: 'vue',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      const exampleFile = files.find((f) => f.filename.includes('.vue'));
      expect(exampleFile).toBeDefined();
      expect(exampleFile!.content).toContain('<script setup');
      expect(exampleFile!.content).toContain('<template>');
    });
  });

  describe('Vanilla JS generation', () => {
    it('generates TypeScript vanilla setup', () => {
      const files = generateSetupCode({
        framework: 'vanilla',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      expect(files.length).toBeGreaterThanOrEqual(2);
      expect(files[0].filename).toContain('gtm-setup.ts');
      expect(files[0].content).toContain('createGtmClient');
    });

    it('generates helper functions', () => {
      const files = generateSetupCode({
        framework: 'vanilla',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      expect(files[0].content).toContain('trackEvent');
      expect(files[0].content).toContain('trackPageView');
      expect(files[0].content).toContain('updateConsent');
    });

    it('generates HTML example', () => {
      const files = generateSetupCode({
        framework: 'vanilla',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      const htmlFile = files.find((f) => f.filename === 'index.html');
      expect(htmlFile).toBeDefined();
      expect(htmlFile!.content).toContain('<!DOCTYPE html>');
      expect(htmlFile!.content).toContain('noscript');
    });

    it('generates UMD example', () => {
      const files = generateSetupCode({
        framework: 'vanilla',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      const umdFile = files.find((f) => f.filename.includes('umd'));
      expect(umdFile).toBeDefined();
      expect(umdFile!.content).toContain('window.GtmKit');
    });
  });

  describe('dataLayerName option', () => {
    it('includes custom data layer name when specified', () => {
      const files = generateSetupCode({
        framework: 'react',
        containers: 'GTM-ABC1234',
        dataLayerName: 'customDataLayer',
        typescript: true
      });

      expect(files[0].content).toContain('customDataLayer');
    });

    it('omits data layer name when not specified', () => {
      const files = generateSetupCode({
        framework: 'react',
        containers: 'GTM-ABC1234',
        typescript: true
      });

      expect(files[0].content).not.toContain('dataLayerName');
    });
  });
});

describe('formatGeneratedCode', () => {
  it('formats files with separators and descriptions', () => {
    const files = [
      {
        filename: 'test.ts',
        content: 'const x = 1;',
        description: 'Test file'
      }
    ];

    const formatted = formatGeneratedCode(files);

    expect(formatted).toContain('test.ts');
    expect(formatted).toContain('Test file');
    expect(formatted).toContain('const x = 1;');
    expect(formatted).toContain('─');
  });

  it('formats multiple files', () => {
    const files = [
      { filename: 'a.ts', content: 'a', description: 'A' },
      { filename: 'b.ts', content: 'b', description: 'B' }
    ];

    const formatted = formatGeneratedCode(files);

    expect(formatted).toContain('a.ts');
    expect(formatted).toContain('b.ts');
  });
});
