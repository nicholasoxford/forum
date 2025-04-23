/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@coral-xyz/anchor"],
  transpilePackages: ["@workspace/ui"],
  images: {
    domains: [
      "cdn.helius-rpc.com",
      "pub-5ed5354b7c9a47748b0040d2e7e3c8a6.r2.dev",
    ],
  },
};

export default nextConfig;
