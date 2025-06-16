/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
  experimental: {
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