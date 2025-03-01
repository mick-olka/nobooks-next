import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
};

export default nextConfig;
