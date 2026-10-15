import type { NextConfig } from "next";

// GitHub Pages serves the site under /thesis-site as static files; Vercel builds stay unchanged.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(process.env.GITHUB_PAGES && { output: "export", trailingSlash: true }),
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
