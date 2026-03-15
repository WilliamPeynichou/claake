/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@claake/shared"],
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };
    return config;
  },
};

export default nextConfig;
