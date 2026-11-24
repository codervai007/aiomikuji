import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The visitor screen used to be called /kiosk.
  async redirects() {
    return [{ source: "/kiosk", destination: "/omikuji", permanent: false }];
  },
};

export default nextConfig;
