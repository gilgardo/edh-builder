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
      // Custom R2 domain from environment variable (supports both https and http for local MinIO)
      ...(process.env.R2_PUBLIC_URL
        ? (() => {
            try {
              const url = new URL(process.env.R2_PUBLIC_URL!);
              return [
                {
                  protocol: url.protocol.replace(':', '') as 'http' | 'https',
                  hostname: url.hostname,
                  ...(url.port ? { port: url.port } : {}),
                  pathname: '/**',
                },
              ];
            } catch {
              return [];
            }
          })()
        : []),
    ],
  },
  typedRoutes: true,
};

export default nextConfig;
