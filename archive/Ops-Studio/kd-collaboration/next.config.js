/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove unstable mdxRs, use standard MDX
  // experimental: {
  //   mdxRs: true
  // },
  
  // Performance optimizations
  compiler: {
    removeConsole: false, // Keep console logs in dev
  },
  
  // Optimize file watching
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Reduce file watching overhead
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**']
      };
    }
    return config;
  }
};

module.exports = nextConfig;
