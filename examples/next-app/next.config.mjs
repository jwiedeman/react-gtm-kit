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
  transpilePackages: ['@react-gtm-kit/core', '@react-gtm-kit/react-modern', '@react-gtm-kit/next'],
  webpack: (config) => {
    config.resolve.alias['@react-gtm-kit/core'] = path.resolve(__dirname, '../../packages/core/src');
    config.resolve.alias['@react-gtm-kit/react-modern'] = path.resolve(__dirname, '../../packages/react-modern/src');
    config.resolve.alias['@react-gtm-kit/next'] = path.resolve(__dirname, '../../packages/next/src');
    return config;
  }
};

export default nextConfig;
