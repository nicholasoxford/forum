import { join } from "path";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@coral-xyz/anchor"],
  outputFileTracingRoot: join(__dirname, "../../"),
  transpilePackages: ["@workspace/ui"],
  images: {
    domains: [
      "cdn.helius-rpc.com",
      "pub-5ed5354b7c9a47748b0040d2e7e3c8a6.r2.dev",
    ],
  },
  output: "standalone",
};

export default nextConfig;
