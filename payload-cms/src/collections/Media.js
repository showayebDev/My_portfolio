import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import { Readable } from 'stream'
import sharp from 'sharp'
import { revalidateAll } from '../lib/revalidate.js'

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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
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
  hooks: {
    beforeChange: [
      async ({ req, data }) => {
        // Skip Sharp conversion for direct client uploads or when raw buffer is not present
        if (
          req.file &&
          !req.file.clientUploadContext &&
          req.file.data &&
          req.file.data.length > 0 &&
          req.file.mimetype &&
          (req.file.mimetype === 'image/png' ||
            req.file.mimetype === 'image/jpeg' ||
            req.file.mimetype === 'image/jpg')
        ) {
          try {
            const webpBuffer = await sharp(req.file.data)
              .webp({ quality: 82, effort: 6 })
              .toBuffer()
            const ext = path.extname(req.file.name)
            const baseName = path.basename(req.file.name, ext)
            const newName = `${baseName}.webp`
            req.file.name = newName
            req.file.data = webpBuffer
            req.file.size = webpBuffer.length
            req.file.mimetype = 'image/webp'
            if (data) {
              data.filename = newName
              data.mimeType = 'image/webp'
              data.filesize = webpBuffer.length
            }
          } catch (e) {
            console.warn('[Media WebP Conversion Hook Error]:', e.message)
          }
        }
        return data
      },
    ],
    afterChange: [
      async () => {
        await revalidateAll()
      },
    ],
    afterDelete: [
      async () => {
        await revalidateAll()
      },
    ],
  },
  upload: {
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/x-icon',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'application/pdf',
    ],
    crop: false,
    focalPoint: false,
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    handlers: [
      async (req, context) => {
        const resolvedParams = context?.params instanceof Promise ? await context.params : context?.params || req.routeParams
        const filename = resolvedParams?.filename
        const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET
        if (!bucket || !filename) return null

        let prefix = resolvedParams?.prefix || req.searchParams?.get('prefix') || ''
        if (!prefix && req.payload) {
          try {
            const found = await req.payload.find({
              collection: 'media',
              where: { filename: { equals: filename } },
              limit: 1,
            })
            if (found?.docs?.[0]) {
              const d = found.docs[0]
              prefix = d._objectKey && d.prefix ? `${d.prefix}/${d._objectKey}` : (d.prefix || '')
            }
          } catch (_) {}
        }

        const s3Key = prefix ? `${prefix}/${filename}` : filename
        const range = req.headers?.get ? req.headers.get('range') : null

        try {
          const s3 = getS3Client()
          const s3Res = await s3.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: s3Key,
              ...(range ? { Range: range } : {}),
            })
          )

          if (s3Res.Body) {
            const ifNoneMatch = req.headers?.get ? req.headers.get('if-none-match') : null
            if (s3Res.ETag && ifNoneMatch && ifNoneMatch === s3Res.ETag) {
              return new Response(null, { status: 304 })
            }

            const contentType = s3Res.ContentType || getMime(filename)
            const isPartial = Boolean(range && s3Res.ContentRange)
            const stream = Readable.toWeb(/** @type {any} */ (s3Res.Body))

            return new Response(/** @type {any} */ (stream), {
              status: isPartial ? 206 : 200,
              headers: {
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
                ...(s3Res.ContentLength != null ? { 'Content-Length': String(s3Res.ContentLength) } : {}),
                ...(s3Res.ContentRange ? { 'Content-Range': s3Res.ContentRange } : {}),
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
