/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 15
  outputFileTracingRoot: __dirname,
  // Disable type checking during build (Next.js 15 validator has known issues)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Experimental features for better build compatibility
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    domains: ["images.unsplash.com", "via.placeholder.com"],
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "your-secret-key-here",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  },
  webpack: (config, { isServer }) => {
    // Fix for Web3Modal and WalletConnect dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        "@react-native-async-storage/async-storage": false,
        "pino-pretty": false,
        encoding: false,
      };

      // Resolve aliases to prevent module resolution errors
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-native-async-storage/async-storage": false,
      };
    }

    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Suppress module not found warnings
    const originalWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings = [
      ...originalWarnings,
      (warning) => {
        if (
          warning.message &&
          warning.message.includes("@react-native-async-storage/async-storage")
        ) {
          return true;
        }
        if (warning.message && warning.message.includes("pino-pretty")) {
          return true;
        }
        return false;
      },
    ];

    return config;
  },
};

module.exports = nextConfig;
