import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  eslint: {
    // Linting runs as its own verification step (`npm run lint`), so the
    // production build is not also gated on it. Keeps build failures about
    // the build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
