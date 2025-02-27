/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all hostnames; adjust if you want to limit specific domains.
      },
    ],
  },
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: '/', // Maps /dashboard to your root page (app/page.tsx)
      },
    ];
  },
};

module.exports = nextConfig;
