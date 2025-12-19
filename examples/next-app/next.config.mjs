import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    externalDir: true
  },
  transpilePackages: ['@jwiedeman/gtm-kit', '@jwiedeman/gtm-kit-react', '@jwiedeman/gtm-kit-next'],
  webpack: (config) => {
    config.resolve.alias['@jwiedeman/gtm-kit'] = path.resolve(__dirname, '../../packages/core/src');
    config.resolve.alias['@jwiedeman/gtm-kit-react'] = path.resolve(__dirname, '../../packages/react-modern/src');
    config.resolve.alias['@jwiedeman/gtm-kit-next'] = path.resolve(__dirname, '../../packages/next/src');
    return config;
  }
};

export default nextConfig;
