/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 adalah modul native, jangan di-bundle oleh webpack
  experimental: { serverComponentsExternalPackages: ["better-sqlite3"] },
};
export default nextConfig;
