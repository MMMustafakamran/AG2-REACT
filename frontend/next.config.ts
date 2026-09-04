import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The recorder may open the demo on 127.0.0.1 while `next dev` lists
  // localhost as its origin. Without this Next refuses its own /_next/static
  // chunks to that host (403), the page never hydrates, and the take fails
  // with "agent never responded". Loopback only; nothing external.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Every `/demo-chat` route in this repo exists to be screen-recorded, and the
  // dev indicator floats over the bottom-left corner of whatever is being
  // filmed. Turning it off is purely cosmetic: Next still surfaces compile and
  // runtime errors, which is what the recordings are often there to capture.
  devIndicators: false,
};

export default nextConfig;
