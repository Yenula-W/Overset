/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build run without clobbering the dev server's cache.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
};
export default nextConfig;
