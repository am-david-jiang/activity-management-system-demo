import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE: "https://davidjiang.tech/ams-demo/api/",
    NEXT_PUBLIC_WS_URL: "wss://davidjiang.tech",
  },
};

export default nextConfig;
