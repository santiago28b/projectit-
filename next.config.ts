import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // ffmpeg-static ships a native binary that must stay on disk (not bundled).
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/ffmpeg-static/ffmpeg*"],
  },
};

export default nextConfig;
