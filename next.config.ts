import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    
    // Generate nonce for inline scripts (in production, this would be dynamic per request)
    const nonce = isDev ? "'unsafe-inline'" : "'nonce-" + Buffer.from(Date.now().toString()).toString('base64') + "'";
    
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Script sources - remove unsafe-eval in production, use nonce for inline scripts
              isDev 
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live"
                : `script-src 'self' ${nonce} https://vercel.live https://va.vercel-scripts.com`,
              // Style sources - allow Google Fonts and use nonce for inline styles in production
              isDev
                ? "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
                : `style-src 'self' ${nonce} https://fonts.googleapis.com`,
              // Font sources
              "font-src 'self' https://fonts.gstatic.com data:",
              // Image sources - allow specific trusted domains
              "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*",
              // Connect sources - restrict to necessary APIs
              isDev
                ? "connect-src 'self' https: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://relay.walletconnect.org wss://relay.walletconnect.com https://vitals.vercel-analytics.com"
                : "connect-src 'self' https://api.debank.com https://static.debank.com https://zap-assets-worker.davidtnfsh.workers.dev https://vitals.vercel-analytics.com wss://relay.walletconnect.org wss://relay.walletconnect.com wss:",
              // Frame sources - allow Web3 wallet connections and trusted domains
              "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org https://*.walletconnect.com",
              // Worker sources for service workers and web workers
              "worker-src 'self' blob:",
              // Media sources
              "media-src 'self' blob: data:",
              // Object and embed restrictions
              "object-src 'none'",
              // Base and form restrictions
              "base-uri 'self'",
              "form-action 'self'",
              // Upgrade insecure requests in production
              ...(isDev ? [] : ["upgrade-insecure-requests"]),
              // Block all mixed content
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
              "payment=('self')",
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
