import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Static generation optimizations
    staticGenerationRetryCount: 3,
    staticGenerationMaxConcurrency: 8,
    staticGenerationMinPagesPerWorker: 25,
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: ['postgres', 'drizzle-orm'],

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration 
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },

  // Performance and optimization
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Output configuration for deployment
  output: 'standalone',
  
  // React configuration
  reactStrictMode: true,
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
