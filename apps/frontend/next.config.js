/** @type {import('next').NextConfig} */
const baseConfig = {
  swcMinify: true,
  reactStrictMode: true,

  /** Transpile workspace packages */
  transpilePackages: ['@unravel/shared-types'],

  /** Image optimization */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  /**
   * Custom webpack config: enable Three.js tree shaking by marking
   * it as a side-effect-free ESM module.
   * @param {import('webpack').Configuration} config
   * @param {{ isServer: boolean }} options
   * @returns {import('webpack').Configuration}
   */
  webpack(config, { isServer }) {
    if (!isServer) {
      /** Prevent server-only modules from being bundled on client */
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },

  experimental: {
    /** Optimize package imports for large libraries */
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei', 'framer-motion'],
  },
};

// Wrap with next-pwa if available; gracefully degrade in environments where it's not installed
let nextConfig = baseConfig;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  });
  nextConfig = withPWA(baseConfig);
} catch {
  // next-pwa not installed — skip PWA wrapping
}

module.exports = nextConfig;
