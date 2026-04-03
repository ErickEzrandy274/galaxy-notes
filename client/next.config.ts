import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tooltip", "@radix-ui/react-popover"],
  },
};

export default nextConfig;
