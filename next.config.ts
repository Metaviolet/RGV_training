import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
