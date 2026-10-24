import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import { Readable } from 'stream'
import {
  timingSafeCompare,
  extractBearerToken,
  parseCookie,
  verifyAdminSession,
} from '../../../lib/auth-helpers.js'

/** @type {S3Client | null} */
let cachedS3Client = null
function getS3Client() {
  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || 'minioadmin',
      },
      region: process.env.S3_REGION || process.env.R2_REGION || 'auto',
      ...(process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
        ? { endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT }
        : { endpoint: 'http://localhost:9000' }),
      forcePathStyle: true,
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
}

export async function GET(req, context) {
  const resolvedParams = context?.params instanceof Promise ? await context.params : context?.params
  const segments = resolvedParams?.path || []
  const key = Array.isArray(segments) ? segments.join('/') : String(segments)
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET || 'my-portfolio'

  if (!key || key.includes('..') || path.isAbsolute(key)) {
    return new Response('Not Found', { status: 404 })
  }

  if (process.env.FULL_RESTRICTION === 'true') {
    const payloadSecret = process.env.PAYLOAD_SECRET

    // 1. Timing-safe verification of x-payload-secret
    const headerSecret = req.headers.get('x-payload-secret')
    const hasSecretHeader = Boolean(payloadSecret && headerSecret && (await timingSafeCompare(headerSecret, payloadSecret)))

    // 2. Timing-safe verification of Authorization: Bearer <secret>
    const bearerToken = extractBearerToken(req.headers.get('authorization'))
    const hasBearerSecret = Boolean(payloadSecret && bearerToken && (await timingSafeCompare(bearerToken, payloadSecret)))

    // 3. Cryptographically verify genuine admin session cookie (payload-token)
    const tokenFromCookie = parseCookie(req.headers.get('cookie'), 'payload-token')
    const hasValidAdminSession = Boolean(
      payloadSecret && tokenFromCookie && (await verifyAdminSession(tokenFromCookie, payloadSecret))
    )

    if (!hasSecretHeader && !hasBearerSecret && !hasValidAdminSession) {
      return new Response('Unauthorized: Access restricted by FULL_RESTRICTION', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  }

  const range = req.headers.get('range')

  try {
    const s3 = getS3Client()
    const s3Res = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(range ? { Range: range } : {}),
      })
    )

    if (s3Res.Body) {
      const ifNoneMatch = req.headers.get('if-none-match')
      if (s3Res.ETag && ifNoneMatch && ifNoneMatch === s3Res.ETag) {
        return new Response(null, { status: 304 })
      }

      const ext = path.extname(key).toLowerCase()
      const contentType = s3Res.ContentType || MIME_MAP[ext] || 'application/octet-stream'
      const isPartial = Boolean(range && s3Res.ContentRange)
      const stream = Readable.toWeb(/** @type {any} */ (s3Res.Body))

      return new Response(/** @type {any} */ (stream), {
        status: isPartial ? 206 : 200,
        headers: {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
          ...(s3Res.ContentLength != null ? { 'Content-Length': String(s3Res.ContentLength) } : {}),
          ...(s3Res.ContentRange ? { 'Content-Range': s3Res.ContentRange } : {}),
          ...(s3Res.ETag ? { ETag: s3Res.ETag } : {}),
        },
      })
    }
  } catch (/** @type {any} */ err) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
      return new Response('Not Found', { status: 404 })
    }
    console.error(`[my-portfolio storage proxy error for ${key}]:`, err?.message || err)
    return new Response('Storage service error', { status: 502 })
  }

  return new Response('Not Found', { status: 404 })
}
