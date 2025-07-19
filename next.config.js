/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
  experimental: {
    // Enable modern bundling optimizations
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
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
    
    // Bundle analyzer for development (commented out to fix build issues)
    // if (process.env.ANALYZE === 'true') {
    //   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    //   config.plugins.push(
    //     new BundleAnalyzerPlugin({
    //       analyzerMode: 'static',
    //       openAnalyzer: true,
    //       reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
    //     })
    //   );
    // }
    
    // Performance optimizations
    if (!dev && !isServer) {
      // Enable tree shaking for better bundle optimization
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        // Split chunks for better caching
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Console components chunk
            console: {
              name: 'console',
              test: /[\\/]components[\\/]console[\\/]/,
              chunks: 'all',
              priority: 10,
            },
            // Dashboard components chunk
            dashboard: {
              name: 'dashboard',
              test: /[\\/]components[\\/]dashboard[\\/]/,
              chunks: 'all',
              priority: 10,
            },
            // Payment components chunk
            payments: {
              name: 'payments',
              test: /[\\/]components[\\/]payments[\\/]/,
              chunks: 'all',
              priority: 10,
            },
            // UI components chunk
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 8,
            },
            // Vendor libraries
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              chunks: 'all',
              priority: 5,
            },
          },
        },
      };
    }
    
    return config;
  },
  // Enable compression
  compress: true,
  // Enable static optimization
  trailingSlash: false,
  // Performance budgets
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;