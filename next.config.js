/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/images/custom/:filename',
          destination: '/api/upload?file=:filename',
        },
      ],
    };
  },
};

module.exports = nextConfig;
