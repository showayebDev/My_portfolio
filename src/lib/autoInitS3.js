// @ts-check
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'

/**
 * Automatically ensures the target S3 bucket exists on application startup.
 * If the bucket does not exist (e.g. fresh MinIO container), it creates it
 * and applies a public-read download policy for media access.
 */
export async function ensureS3Bucket() {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET
  if (!bucket) return

  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
  const isForcePathStyle = endpoint
    ? process.env.S3_FORCE_PATH_STYLE !== 'false'
    : process.env.S3_FORCE_PATH_STYLE === 'true'

  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
    },
    region: process.env.S3_REGION || process.env.R2_REGION || 'auto',
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: isForcePathStyle,
  })

  const maxAttempts = 15
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Check if bucket exists
      let bucketExists = false
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }))
        bucketExists = true
      } catch (/** @type {any} */ headErr) {
        if (
          headErr?.name === 'NotFound' ||
          headErr?.name === 'NoSuchBucket' ||
          headErr?.$metadata?.httpStatusCode === 404
        ) {
          bucketExists = false
        } else {
          throw headErr
        }
      }

      // 2. Create bucket if not found
      if (!bucketExists) {
        console.log(`[S3 Auto-Init] Bucket "${bucket}" not found. Creating...`)
        await client.send(new CreateBucketCommand({ Bucket: bucket }))
        console.log(`[S3 Auto-Init] Bucket "${bucket}" created successfully!`)
      }

      // 3. Set anonymous download policy for MinIO / S3 public media serving
      try {
        const publicPolicy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        }
        await client.send(
          new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: JSON.stringify(publicPolicy),
          })
        )
      } catch (_) {
        // Ignored: Cloudflare R2 and some providers manage public access outside bucket policies
      }

      console.log(`[S3 Auto-Init] Storage bucket "${bucket}" is ready.`)
      break
    } catch (/** @type {any} */ err) {
      if (attempt < maxAttempts) {
        // Wait 1 second and retry (allows MinIO container startup to settle)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        console.warn(`[S3 Auto-Init] Note: Could not auto-initialize S3 bucket "${bucket}":`, err?.message || err)
      }
    }
  }
}
