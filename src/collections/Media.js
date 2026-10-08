// @ts-check
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'

/** @type {S3Client | null} */
let cachedS3Client = null
function getS3Client() {
  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
      },
      region: process.env.S3_REGION || process.env.R2_REGION || 'auto',
      ...(process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
        ? { endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT }
        : {}),
      forcePathStyle: (process.env.S3_ENDPOINT || process.env.R2_ENDPOINT)
        ? process.env.S3_FORCE_PATH_STYLE !== 'false'
        : process.env.S3_FORCE_PATH_STYLE === 'true',
    })
  }
  return cachedS3Client
}

/** @type {Record<string, string>} */
const MIME_MAP = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
}

/** @param {string} [filename] */
function getMime(filename) {
  const ext = path.extname(filename || '').toLowerCase()
  return MIME_MAP[ext] || 'application/octet-stream'
}

/** @type {import('payload').CollectionConfig} */
export const Media = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'prefix', 'alt', 'filesize', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'prefix',
      type: 'select',
      label: 'Storage Folder',
      defaultValue: 'media',
      required: true,
      options: [
        { label: '📁 projects (Project thumbnails & previews)', value: 'projects' },
        { label: '📁 icons (Tech & UI icons)', value: 'icons' },
        { label: '📁 profile (Profile avatar & photos)', value: 'profile' },
        { label: '📁 media (General media & assets)', value: 'media' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Target folder inside S3 / object storage bucket.',
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
    },
  ],
  upload: {
    crop: false,
    focalPoint: false,
    handlers: [
      async (req, { params }) => {
        const filename = params?.filename
        const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET
        if (!bucket || !filename) return null

        const prefix = params?.prefix || req.searchParams?.get('prefix') || ''
        const s3Key = prefix ? `${prefix}/${filename}` : filename

        try {
          const s3 = getS3Client()
          const s3Res = await s3.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: s3Key,
            })
          )

          if (s3Res.Body) {
            const ifNoneMatch = req.headers?.get ? req.headers.get('if-none-match') : null
            if (s3Res.ETag && ifNoneMatch && ifNoneMatch === s3Res.ETag) {
              return new Response(null, { status: 304 })
            }

            const bytes = await s3Res.Body.transformToByteArray()
            const contentType = s3Res.ContentType || getMime(filename)

            return new Response(/** @type {any} */ (bytes), {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Content-Length': String(bytes.length),
                ...(s3Res.ETag ? { ETag: s3Res.ETag } : {}),
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
              },
            })
          }
        } catch (/** @type {any} */ err) {
          if (err?.name === 'NoSuchKey' || err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
            return new Response('Not Found', { status: 404 })
          }
          req.payload?.logger?.error?.(`[Media Controller] S3 fetch error for ${s3Key}: ${err?.message || err}`)
          return new Response('Error fetching from storage', { status: 502 })
        }

        return null
      },
    ],
  },
}
