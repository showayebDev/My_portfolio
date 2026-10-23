// @ts-check
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError, Forbidden } from 'payload'

/**
 * Creates an S3 Client configured for client-facing pre-signed URL signing.
 * In local Docker, this ensures the Host header in SigV4 matches what the browser sends (e.g. localhost:9000).
 * In production (AWS S3 or Cloudflare R2), it uses the public endpoint.
 */
function getSigningClient() {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET || ''

  let clientEndpoint =
    process.env.S3_CLIENT_ENDPOINT ||
    process.env.NEXT_PUBLIC_S3_ENDPOINT ||
    process.env.S3_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    ''

  // Rewrite internal Docker hostname 's3:9000' to 'localhost:9000' for host browser access
  if (clientEndpoint.includes('//s3:9000')) {
    clientEndpoint = clientEndpoint.replace('//s3:9000', '//localhost:9000')
  }

  return {
    bucket,
    client: new S3Client({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
      },
      region: process.env.S3_REGION || process.env.R2_REGION || 'auto',
      ...(clientEndpoint ? { endpoint: clientEndpoint } : {}),
      forcePathStyle: clientEndpoint
        ? process.env.S3_FORCE_PATH_STYLE !== 'false'
        : process.env.S3_FORCE_PATH_STYLE === 'true',
    }),
  }
}

/**
 * Custom signed URL generator for Payload Media client uploads.
 * Replaces the default handler of `/storage-s3-generate-signed-url` to ensure the signed URL
 * uses the browser-reachable endpoint (e.g. localhost:9000 vs s3:9000 in Docker) with valid SigV4 signature.
 * @param {import('payload').PayloadRequest} req
 */
export async function handleS3GenerateSignedURL(req) {
  if (!req.json) {
    throw new APIError('Content-Type expected to be application/json', 400)
  }

  if (!req.user) {
    throw new Forbidden()
  }

  /** @type {{ collectionSlug?: string, docPrefix?: string, filename?: string, filesize?: number, mimeType?: string }} */
  const body = await req.json()
  const { collectionSlug = 'media', docPrefix, filename, mimeType } = body

  if (!filename) {
    throw new APIError('Filename is required', 400)
  }

  const { bucket, client: signingClient } = getSigningClient()
  if (!bucket) {
    throw new APIError('S3 storage bucket is not configured', 500)
  }

  // Use Payload's official resolveSignedURLKey to generate _objectKey, deduplicated filename, and HMAC signed receipt
  const { clientUploadContext, fileKey, sanitizedDocPrefix, sanitizedFilename } =
    await resolveSignedURLKey({
      collectionPrefix: '',
      collectionSlug,
      docPrefix: docPrefix || 'media',
      filename,
      req,
      useCompositePrefixes: false,
    })

  const signableHeaders = new Set()
  if (mimeType) {
    signableHeaders.add('content-type')
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ContentType: mimeType || undefined,
  })

  // URL valid for 15 minutes (900 seconds)
  const url = await getSignedUrl(signingClient, command, {
    expiresIn: 900,
    signableHeaders,
  })

  return Response.json({
    clientUploadContext,
    docPrefix: sanitizedDocPrefix,
    filename: sanitizedFilename,
    headers: {
      ...(mimeType ? { 'Content-Type': mimeType } : {}),
    },
    url,
  })
}

/**
 * Payload plugin to override the `/storage-s3-generate-signed-url` endpoint
 * with the browser-friendly SigV4 signing handler.
 * @returns {import('payload').Plugin}
 */
export function s3ClientUploadCustomizer() {
  return (config) => {
    if (!config.endpoints) config.endpoints = []
    const idx = config.endpoints.findIndex((e) => e.path === '/storage-s3-generate-signed-url')
    if (idx !== -1) {
      config.endpoints[idx].handler = handleS3GenerateSignedURL
    } else {
      config.endpoints.push({
        path: '/storage-s3-generate-signed-url',
        method: 'post',
        handler: handleS3GenerateSignedURL,
      })
    }
    return config
  }
}
