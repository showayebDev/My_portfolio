/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "r2.showayeb.dev",
      },
    ],
  },
};

export default nextConfig;
