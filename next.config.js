/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@cursor/sdk"],
  },
};

module.exports = nextConfig;
