/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
  experimental: {
  },
  env: {
    // Make Django backend URLs available to the client
    NEXT_PUBLIC_DJANGO_API_URL: process.env.NEXT_PUBLIC_DJANGO_API_URL,
    NEXT_PUBLIC_DJANGO_WS_URL: process.env.NEXT_PUBLIC_DJANGO_WS_URL,
  },
  webpack: (config, { dev, isServer }) => {
    // Disable webpack cache in development to prevent cache corruption
    if (dev) {
      config.cache = false;
    }
    
    // Suppress critical dependency warnings from third-party libraries
    config.module.exprContextCritical = false;
    
    return config;
  },
};

module.exports = nextConfig;