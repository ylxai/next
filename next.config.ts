import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize HMR for development
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // Images configuration
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
