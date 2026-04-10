import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@tsarstva/data"],
};

export default nextConfig;
