import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',

  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },

  // Base path for GitHub Pages (repository name)
  // Change 'aquafuzzy-analytics' to your actual repository name
  basePath: isProd ? '/aquafuzzy-analytics' : '',

  // Asset prefix for GitHub Pages
  assetPrefix: isProd ? '/aquafuzzy-analytics/' : '',

  // Trailing slash for better compatibility
  trailingSlash: true,
};

export default nextConfig;
