import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Needed so Node 20 production (`next start`) can polyfill WebSocket for Supabase.
  // @react-pdf/renderer uses Node fontkit/pdfkit APIs — keep it external.
  serverExternalPackages: ["ws", "@react-pdf/renderer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
