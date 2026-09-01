import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every `/demo-chat` route in this repo exists to be screen-recorded, and the
  // dev indicator floats over the bottom-left corner of whatever is being
  // filmed. Turning it off is purely cosmetic: Next still surfaces compile and
  // runtime errors, which is what the recordings are often there to capture.
  devIndicators: false,
};

export default nextConfig;
