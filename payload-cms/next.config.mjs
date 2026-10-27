// @ts-check
import dns from 'node:dns'
if (typeof dns?.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first')
}
import fs from 'node:fs'
import path from 'node:path'
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {Array<import('next/dist/shared/lib/image-config').RemotePattern>} */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: '**',
  },
]

if (process.env.NODE_ENV === 'development') {
  remotePatterns.push(
    {
      protocol: 'http',
      hostname: 'localhost',
    },
    {
      protocol: 'http',
      hostname: 's3',
    }
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(import.meta.dirname, '..'),
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  generateBuildId: async () => {
    try {
      const versionFile = path.join(process.cwd(), 'public', 'version.json')
      if (fs.existsSync(versionFile)) {
        const data = JSON.parse(fs.readFileSync(versionFile, 'utf-8'))
        if (data.buildId) return String(data.buildId)
      }
    } catch {}
    return null
  },
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    qualities: [75, 90],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns,
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
  },


  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/version.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/my-portfolio/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.(svg|jpg|jpeg|png|webp|avif|ico|gif|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/media/file/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/admin/reset-password',
        has: [
          {
            type: 'query',
            key: 'token',
            value: '(?<token>.*)',
          },
        ],
        destination: '/admin/reset/:token',
        permanent: false,
      },
      {
        source: '/docs',
        destination: '/api/docs',
        permanent: false,
      },
      {
        source: '/swagger',
        destination: '/api/docs',
        permanent: false,
      },
      {
        source: '/api/swagger',
        destination: '/api/docs',
        permanent: false,
      },
    ]
  },

  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
