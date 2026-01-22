import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cards.scryfall.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'c1.scryfall.com',
        pathname: '/**',
      },
    ],
  },
  typedRoutes: true,
};

export default nextConfig;
