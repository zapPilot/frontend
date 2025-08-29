import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Remove console.log in production builds, but keep console.warn and console.error
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['warn', 'error']
    } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zap-assets-worker.davidtnfsh.workers.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.debank.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Narrow webpack dev watcher scope to reduce memory/CPU (webpack-only)
  webpackDevMiddleware(config: any) {
    config.watchOptions = {
      ...(config.watchOptions || {}),
      ignored: [
        "**/.git/**",
        "**/.next/**",
        "**/node_modules/**",
        "**/coverage/**",
        "**/.turbo/**",
        "**/.cache/**",
        "**/playwright-report/**",
        "**/test-results/**",
        "**/out/**",
        "**/uploads/**",
      ],
    } as any;
    return config;
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    
    // Note: For future implementation, nonces could be generated per-request for enhanced CSP security
    // const nonce = Buffer.from(Math.random().toString()).toString('base64').substring(0, 16);
    
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Script sources - Further hardened
              isDev 
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
                : [
                    "script-src 'self'",
                    // Note: unsafe-eval completely removed in production
                    // Consider adding nonce support: 'nonce-${nonce}' for inline scripts
                  ].join(" "),
              // Style sources - Hardened for production, dev needs flexibility
              isDev
                ? "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
                : [
                    "style-src 'self'",
                    "'unsafe-inline'", // Required for Tailwind CSS and Framer Motion
                    "https://fonts.googleapis.com",
                    // Future improvement: Use nonces for inline styles where possible
                  ].join(" "),
              // Font sources
              "font-src 'self' https://fonts.gstatic.com data:",
              // Image sources - allow specific trusted domains
              "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*",
              // Connect sources - Further restricted and organized
              isDev
                ? "connect-src 'self' https: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://relay.walletconnect.org wss://relay.walletconnect.com https://vitals.vercel-analytics.com"
                : [
                    "connect-src 'self'",
                    // Core API endpoints (minimized)
                    "https://api.debank.com",
                    "https://static.debank.com", 
                    "https://zap-assets-worker.davidtnfsh.workers.dev",
                    // Web3 wallet connections (required)
                    "wss://relay.walletconnect.org",
                    "wss://relay.walletconnect.com",
                    // Core RPC providers only (reduced list)
                    "https://rpc.thirdweb.com",
                    "https://mainnet.infura.io",
                    "https://polygon-rpc.com"
                    // Removed less critical endpoints to reduce attack surface
                  ].join(" "),
              // Frame sources - Further restricted
              "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org",
              // Worker sources for service workers and web workers
              "worker-src 'self' blob:",
              // Media sources 
              "media-src 'self' blob: data:",
              // Object and embed restrictions (strict)
              "object-src 'none'",
              // Base URI restrictions (strict)
              "base-uri 'self'",
              // Form action restrictions (strict)
              "form-action 'self'",
              // Manifest source for PWA
              "manifest-src 'self'",
              // Additional security headers
              ...(isDev ? [] : [
                "upgrade-insecure-requests",
                // Strict Transport Security enforcement
                "require-trusted-types-for 'script'", // Future-proofing for Trusted Types
              ]),
              // Block all mixed content (strict)
              "block-all-mixed-content"
            ].join("; ")
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=(self)",
              "usb=()",
              "serial=()",
              "bluetooth=()",
              "magnetometer=()",
              "accelerometer=()",
              "gyroscope=()",
              "ambient-light-sensor=()",
              "autoplay=()"
            ].join(", ")
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless"
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin"
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin"
          }
        ]
      }
    ];
  }
};

// PWA configuration (type declaration added inline)
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
