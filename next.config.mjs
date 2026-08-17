/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
