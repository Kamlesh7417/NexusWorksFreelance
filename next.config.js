/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
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
    return config;
  },
};

module.exports = nextConfig;