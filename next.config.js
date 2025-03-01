/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all hostnames (not recommended for security). Define specific domains if possible.
      },
    ],
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/dashboard",
        destination: "/", // ⚠️ Double-check if you actually need this
      },
    ];
  },
};

module.exports = nextConfig;
