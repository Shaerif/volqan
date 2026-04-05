import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from common external hosts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
    ],
  },

  // Transpile @volqan/* workspace packages
  transpilePackages: ['@volqan/core'],

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ['localhost:3001'],
    },
  },
};

export default nextConfig;
