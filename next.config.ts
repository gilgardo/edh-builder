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
      // Cloudflare R2 public bucket (*.r2.dev default domain)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
      // Custom R2 domain from environment variable
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              protocol: 'https' as const,
              hostname: new URL(process.env.R2_PUBLIC_URL).hostname,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
  typedRoutes: true,
};

export default nextConfig;
