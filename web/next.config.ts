import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Ship the SQLite file with Vercel serverless functions.
  outputFileTracingIncludes: {
    "/**/*": ["./db/data.db"],
  },
};

export default nextConfig;
