import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // NEXT_PUBLIC_API_BASE: "https://activity-management-system-server.vercel.app/api/",
    // NEXT_PUBLIC_WS_URL: "https://activity-management-system-server.vercel.app",
    NEXT_PUBLIC_API_BASE: "http://localhost:8000/api/",
    NEXT_PUBLIC_WS_URL: "ws://localhost:8000",
  },
};

export default nextConfig;
