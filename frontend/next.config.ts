import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow this Mac's Tailscale IP to load dev resources so the M2 worker
  // browser (Playwright on m2worker) can hydrate React + connect to HMR.
  allowedDevOrigins: ["100.100.148.117", "192.168.0.162"],
};

export default nextConfig;
