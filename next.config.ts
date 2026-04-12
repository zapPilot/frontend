import type { NextConfig } from "next";

// Security headers (CSP, HSTS, etc.) must be configured at the hosting/CDN
// layer since `output: 'export'` produces static files with no Next.js server
// to inject HTTP headers.  See git history for the previous headers() config.

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16+
  // Explicit root prevents Turbopack from inferring the wrong workspace root
  // when a parent directory also contains a lockfile.
  turbopack: { root: import.meta.dirname },
  experimental: {
    preloadEntriesOnStart: false,
    webpackMemoryOptimizations: true,
  },
  compiler: {
    // Remove console.log in production builds, but keep console.warn and console.error
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['warn', 'error']
    } : false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zap-assets-worker.davidtnfsh.workers.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'export',

  /**
   * Webpack configuration override
   * Optimizes file watching to reduce memory/CPU usage in development
   *
   * Note: This configuration only applies when using Webpack bundler.
   * When using Turbopack (default), this configuration is ignored.
   *
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/webpack
   */
  webpack: (config, { dev, isServer }) => {
    // Stub optional peer deps of @wagmi/connectors that are not installed
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@base-org/account": false,
        "@metamask/connect-evm": false,
      },
    };

    // Only apply watch optimizations in development mode
    // Skip on server builds to avoid conflicts
    if (dev && !isServer) {
      // In Next.js 15, watchOptions has read-only property descriptors
      // We need to use Object.defineProperty to properly override it
      // Source: https://github.com/vercel/next.js/issues/77520
      Object.defineProperty(config, "watchOptions", {
        ...Object.getOwnPropertyDescriptor(config, "watchOptions"),
        value: {
          ...config.watchOptions,
          ignored: [
            "**/node_modules/**",
            "**/.git/**",
            "**/.next/**",
            "**/coverage/**",
            "**/.turbo/**",
            "**/.cache/**",
            "**/playwright-report/**",
            "**/test-results/**",
            "**/out/**",
            "**/uploads/**",
          ],
        },
      });
    }

    return config;
  },
};

// PWA configuration (type declaration added inline)
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

export default process.env.NODE_ENV === "development"
  ? nextConfig
  : withPWA(nextConfig);
