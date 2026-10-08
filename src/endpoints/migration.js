// @ts-check
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import JSZip from 'jszip'
import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { Users } from '../collections/Users.js'
import { Media } from '../collections/Media.js'
import { Projects } from '../collections/Projects.js'
import { Skills } from '../collections/Skills.js'
import { SkillCategories } from '../collections/SkillCategories.js'
import { Education } from '../collections/Education.js'
import { Profile } from '../globals/Profile.js'

/**
 * Creates an S3 Client for the given credentials
 * @param {{
 *   bucket?: string,
 *   accessKeyId?: string,
 *   secretAccessKey?: string,
 *   endpoint?: string,
 *   region?: string,
 *   forcePathStyle?: boolean | string
 * }} config
 */
function createS3Client(config) {
  const isForcePathStyle =
    typeof config.forcePathStyle === 'boolean'
      ? config.forcePathStyle
      : config.endpoint
      ? config.forcePathStyle !== 'false'
      : config.forcePathStyle === 'true'

  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId || '',
      secretAccessKey: config.secretAccessKey || '',
    },
    region: config.region || 'auto',
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    forcePathStyle: isForcePathStyle,
  })
}

/**
 * Returns the source S3 client based on current environment variables
 */
function getSourceS3Client() {
  return createS3Client({
    bucket: process.env.S3_BUCKET || process.env.R2_BUCKET || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
    endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || '',
    region: process.env.S3_REGION || process.env.R2_REGION || 'auto',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE,
  })
}

/**
 * Reads a file's byte array from the source S3 bucket
 * @param {any} doc
 */
async function fetchSourceFile(doc) {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET
  if (!bucket) {
    throw new Error('Current S3_BUCKET is not set in environment variables.')
  }

  const s3 = getSourceS3Client()
  const prefix = doc.prefix || ''
  const filename = doc.filename
  if (!filename) {
    throw new Error('Media document is missing a filename.')
  }

  // Try path with prefix first, then fallback to root if not found
  const candidateKeys = prefix ? [`${prefix}/${filename}`, filename] : [filename]

  let lastErr = null
  for (const key of candidateKeys) {
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      if (res.Body) {
        const bytes = await res.Body.transformToByteArray()
        return {
          bytes,
          contentType: res.ContentType || doc.mimeType || 'application/octet-stream',
          resolvedKey: key,
        }
      }
    } catch (err) {
      lastErr = err
    }
  }

  throw lastErr || new Error(`File "${filename}" not found in source bucket.`)
}

/**
 * Helper to check admin authorization.
 * Allows execution if the user is authenticated, OR if the active database has 0 users
 * so the administrator can bootstrap and seed their credentials.
 * @param {import('payload').PayloadRequest} req
 */
async function ensureAdmin(req) {
  if (req.user) return null

  // Allow setup/restore operations if the active database has 0 users (initial bootstrap state)
  try {
    const usersResult = await req.payload.find({
      collection: 'users',
      limit: 1,
    })
    if (usersResult.totalDocs === 0) {
      return null
    }
  } catch {
    // If table/collection does not exist yet, allow bootstrap
    return null
  }

  return Response.json(
    { error: 'Unauthorized: Admin login required. Please sign in to your admin panel.' },
    { status: 401 }
  )
}

/**
 * GET /api/migration/status
 * Returns current system stats (database type, current bucket, total media count, and auth status)
 * @param {import('payload').PayloadRequest} req
 */
export async function handleGetStatus(req) {
  try {
    const dbUrl = (process.env.DATABASE_URL || process.env.MONGODB_URI || '').trim()
    const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')

    let mediaCount = 0
    let projectsCount = 0
    let skillsCount = 0
    let usersCount = 0

    try {
      const [mediaRes, projRes, skillsRes, usersRes] = await Promise.all([
        req.payload.find({ collection: 'media', limit: 1 }),
        req.payload.find({ collection: 'projects', limit: 1 }),
        req.payload.find({ collection: 'skills', limit: 1 }),
        req.payload.find({ collection: 'users', limit: 1 }),
      ])
      mediaCount = mediaRes.totalDocs || 0
      projectsCount = projRes.totalDocs || 0
      skillsCount = skillsRes.totalDocs || 0
      usersCount = usersRes.totalDocs || 0
    } catch {
      // Database might be initializing
    }

    return Response.json({
      isAuthenticated: Boolean(req.user),
      user: req.user ? { email: req.user.email } : null,
      database: {
        type: isPostgres ? 'PostgreSQL' : 'MongoDB',
        isPostgres,
        urlPreview: dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'Not Configured',
      },
      storage: {
        bucket: process.env.S3_BUCKET || process.env.R2_BUCKET || 'Not Configured',
        endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || 'AWS S3 Default',
        region: process.env.S3_REGION || process.env.R2_REGION || 'auto',
      },
      counts: {
        media: mediaCount,
        projects: projectsCount,
        skills: skillsCount,
        users: usersCount,
      },
    })
  } catch (/** @type {any} */ err) {
    return Response.json({ error: err.message || 'Failed to fetch status' }, { status: 500 })
  }
}

/**
 * POST /api/migration/test-bucket
 * Validates connection to destination bucket
 * @param {import('payload').PayloadRequest} req
 */
export async function handleTestBucket(req) {
  const authErr = await ensureAdmin(req)
  if (authErr) return authErr

  try {
    /** @type {any} */
    const body = await req.json()
    const { bucket, endpoint, accessKeyId, secretAccessKey, region, forcePathStyle } = body

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return Response.json(
        { error: 'Bucket Name, Access Key ID, and Secret Access Key are required.' },
        { status: 400 }
      )
    }

    const testClient = createS3Client({
      bucket,
      endpoint,
      accessKeyId,
      secretAccessKey,
      region,
      forcePathStyle,
    })

    // Test by listing with max 1 key
    const res = await testClient.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1,
      })
    )

    return Response.json({
      success: true,
      message: `Connection successful to bucket "${bucket}"!`,
      keyCount: res.KeyCount ?? 0,
    })
  } catch (/** @type {any} */ err) {
    return Response.json(
      {
        success: false,
        error: err.message || 'Failed to connect to destination bucket. Check your credentials.',
      },
      { status: 400 }
    )
  }
}

/**
 * GET /api/migration/download-zip
 * Downloads all media files bundled into a ZIP archive with folders based on prefix
 * @param {import('payload').PayloadRequest} req
 */
export async function handleDownloadZip(req) {
  const authErr = await ensureAdmin(req)
  if (authErr) return authErr

  try {
    const allMedia = await req.payload.find({
      collection: 'media',
      limit: 1000,
    })

    if (!allMedia.docs || allMedia.docs.length === 0) {
      return Response.json({ error: 'No media files found to download.' }, { status: 404 })
    }

    const zip = new JSZip()
    const failedFiles = []
    let addedCount = 0

    for (const doc of allMedia.docs) {
      try {
        const { bytes } = await fetchSourceFile(doc)
        const folderName = doc.prefix || 'media'
        const folder = zip.folder(folderName)
        if (folder) {
          folder.file(doc.filename, bytes)
          addedCount++
        }
      } catch (/** @type {any} */ err) {
        failedFiles.push({ filename: doc.filename, error: err.message })
      }
    }

    if (addedCount === 0) {
      return Response.json(
        {
          error: 'Could not fetch any media files from current storage. Please verify S3 settings.',
          details: failedFiles,
        },
        { status: 502 }
      )
    }

    // Add a README to the ZIP explaining the folders and manifest
    zip.file(
      'README_BACKUP.txt',
      `Media Backup Generated on ${new Date().toISOString()}\nTotal files: ${addedCount}\nFailed: ${failedFiles.length}\n\nFolders:\n- projects/ (Project previews & thumbnails)\n- icons/ (Tech & UI icons)\n- profile/ (Avatar & resume assets)\n- media/ (General media)\n`
    )

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const timestamp = new Date().toISOString().slice(0, 10)
    return new Response(/** @type {any} */ (zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="portfolio-media-${timestamp}.zip"`,
        'Content-Length': String(zipBuffer.length),
      },
    })
  } catch (/** @type {any} */ err) {
    return Response.json(
      { error: err.message || 'Failed to generate ZIP archive.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/migration/transfer-bucket
 * Direct cloud-to-cloud migration of all media files to a new bucket
 * @param {import('payload').PayloadRequest} req
 */
export async function handleTransferBucket(req) {
  const authErr = await ensureAdmin(req)
  if (authErr) return authErr

  try {
    /** @type {any} */
    const body = await req.json()
    const { bucket, endpoint, accessKeyId, secretAccessKey, region, forcePathStyle } = body

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return Response.json(
        { error: 'Destination Bucket Name, Access Key ID, and Secret Access Key are required.' },
        { status: 400 }
      )
    }

    const destClient = createS3Client({
      bucket,
      endpoint,
      accessKeyId,
      secretAccessKey,
      region,
      forcePathStyle,
    })

    const allMedia = await req.payload.find({
      collection: 'media',
      limit: 1000,
    })

    if (!allMedia.docs || allMedia.docs.length === 0) {
      return Response.json({
        success: true,
        message: 'No media files found to transfer.',
        transferred: 0,
        failed: 0,
      })
    }

    const results = []
    let transferred = 0
    let failed = 0

    for (const doc of allMedia.docs) {
      const folder = doc.prefix || 'media'
      const destKey = `${folder}/${doc.filename}`

      try {
        const { bytes, contentType } = await fetchSourceFile(doc)

        await destClient.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: destKey,
            Body: bytes,
            ContentType: contentType,
          })
        )

        transferred++
        results.push({ key: destKey, status: 'success' })
      } catch (/** @type {any} */ err) {
        failed++
        results.push({ key: destKey, status: 'failed', error: err.message })
      }
    }

    // Generate suggested .env snippet
    const envSnippet = `# Cloudflare R2 / S3 Storage Credentials\nS3_BUCKET=${bucket}\nS3_ACCESS_KEY_ID=${accessKeyId}\nS3_SECRET_ACCESS_KEY=${secretAccessKey}\nS3_ENDPOINT=${endpoint || ''}\nS3_REGION=${region || 'auto'}\nS3_FORCE_PATH_STYLE=${forcePathStyle ? 'true' : 'false'}\n`

    return Response.json({
      success: true,
      total: allMedia.docs.length,
      transferred,
      failed,
      results,
      envSnippet,
    })
  } catch (/** @type {any} */ err) {
    return Response.json(
      { error: err.message || 'Storage migration failed.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/migration/export-db
 * Exports all database collections & globals to a JSON file
 * @param {import('payload').PayloadRequest} req
 */
export async function handleExportDb(req) {
  const authErr = await ensureAdmin(req)
  if (authErr) return authErr

  try {
    const [categories, skills, projects, education, media, profile, users] = await Promise.all([
      req.payload.find({ collection: 'skill-categories', limit: 1000 }),
      req.payload.find({ collection: 'skills', limit: 1000 }),
      req.payload.find({ collection: 'projects', limit: 1000 }),
      req.payload.find({ collection: 'education', limit: 1000 }),
      req.payload.find({ collection: 'media', limit: 1000 }),
      req.payload.findGlobal({ slug: 'profile' }),
      req.payload.find({ collection: 'users', limit: 100, showHiddenFields: true }),
    ])

    // Include user credentials with encrypted password hash & salt for seamless login migration
    const safeUsers = (users?.docs || []).map((u) => ({
      email: u.email,
      hash: u.hash,
      salt: u.salt,
    }))

    const dump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      collections: {
        'skill-categories': categories.docs || [],
        skills: skills.docs || [],
        projects: projects.docs || [],
        education: education.docs || [],
        media: media.docs || [],
        users: safeUsers,
      },
      globals: {
        profile,
      },
    }

    const jsonString = JSON.stringify(dump, null, 2)
    const timestamp = new Date().toISOString().slice(0, 10)

    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="portfolio-database-${timestamp}.json"`,
      },
    })
  } catch (/** @type {any} */ err) {
    return Response.json(
      { error: err.message || 'Database export failed.' },
      { status: 500 }
    )
  }
}

/** @type {Map<string, any>} */
const targetPayloadCache = new Map()

/**
 * Initializes or reuses a Payload instance connected to an external target database
 * @param {string} targetUrl
 */
export async function getTargetPayload(targetUrl) {
  const cleanUrl = (targetUrl || '').trim()
  if (!cleanUrl) {
    throw new Error('Database connection string is required.')
  }

  const isPostgres = cleanUrl.startsWith('postgres://') || cleanUrl.startsWith('postgresql://')
  const isMongo = cleanUrl.startsWith('mongodb://') || cleanUrl.startsWith('mongodb+srv://')

  if (!isPostgres && !isMongo) {
    throw new Error(
      'Unsupported database protocol. URL must start with postgresql:// or mongodb:// (or mongodb+srv://).'
    )
  }

  if (targetPayloadCache.has(cleanUrl)) {
    return targetPayloadCache.get(cleanUrl)
  }

  const instanceKey = `target_${Buffer.from(cleanUrl).toString('base64url').slice(0, 32)}`

  const targetConfig = await buildConfig({
    secret: process.env.PAYLOAD_SECRET || 'migration-dynamic-secret-key-min-32-chars-long',
    collections: [Users, Media, Projects, Skills, SkillCategories, Education],
    globals: [Profile],
    editor: lexicalEditor(),
    db: isPostgres
      ? postgresAdapter({
          pool: {
            connectionString: cleanUrl,
            connectionTimeoutMillis: 10000,
          },
          push: true,
        })
      : mongooseAdapter({
          url: cleanUrl,
          connectOptions: {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
          },
        }),
    plugins: [
      ...(Boolean(process.env.S3_BUCKET || process.env.R2_BUCKET)
        ? [
            s3Storage({
              collections: {
                media: {
                  disablePayloadAccessControl: true,
                },
              },
              bucket: process.env.S3_BUCKET || process.env.R2_BUCKET || '',
              config: {
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
              },
            }),
          ]
        : []),
    ],
  })

  const instance = await getPayload({ key: instanceKey, config: targetConfig })
  targetPayloadCache.set(cleanUrl, instance)
  return instance
}

/**
 * Executes import of an in-memory database dump into a target Payload instance with ID mapping
 * @param {any} targetPayload
 * @param {any} dump
 */
export async function executeDumpImport(targetPayload, dump) {
  if (!dump || !dump.collections) {
    throw new Error('Invalid database dump format. Expected "collections" property.')
  }

  const { collections, globals } = dump
  /** @type {Record<string, Record<string | number, string | number>>} */
  const idMap = {
    categories: {},
    media: {},
    skills: {},
  }

  const stats = {
    users: 0,
    categories: 0,
    skills: 0,
    projects: 0,
    education: 0,
    media: 0,
    profileUpdated: false,
  }

  // 0. Users (Import credentials with hash & salt)
  if (Array.isArray(collections['users'])) {
    for (const u of collections['users']) {
      if (!u.email) continue
      try {
        const existing = await targetPayload.find({
          collection: 'users',
          where: { email: { equals: u.email } },
          limit: 1,
          showHiddenFields: true,
        })

        if (existing.docs.length === 0) {
          await targetPayload.create({
            collection: 'users',
            data: {
              email: u.email,
              hash: u.hash,
              salt: u.salt,
            },
          })
          stats.users++
        } else {
          if (u.hash && u.salt) {
            await targetPayload.update({
              collection: 'users',
              id: existing.docs[0].id,
              data: {
                hash: u.hash,
                salt: u.salt,
              },
            })
          }
          stats.users++
        }
      } catch (/** @type {any} */ err) {
        console.warn(`[User Import] Failed for ${u.email}:`, err?.message || err)
      }
    }
  }

  // 1. Skill Categories
  if (Array.isArray(collections['skill-categories'])) {
    for (const item of collections['skill-categories']) {
      const oldId = item.id
      try {
        const existing = await targetPayload.find({
          collection: 'skill-categories',
          where: { slug: { equals: item.slug } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          const targetId = existing.docs[0].id
          idMap.categories[oldId] = targetId
          if (item.slug) idMap.categories[item.slug] = targetId
          await targetPayload.update({
            collection: 'skill-categories',
            id: targetId,
            data: {
              name: item.name,
              sortOrder: item.sortOrder ?? 1,
            },
          })
          stats.categories++
        } else {
          const created = await targetPayload.create({
            collection: 'skill-categories',
            data: {
              name: item.name,
              slug: item.slug,
              sortOrder: item.sortOrder ?? 1,
            },
          })
          idMap.categories[oldId] = created.id
          if (item.slug) idMap.categories[item.slug] = created.id
          stats.categories++
        }
      } catch (/** @type {any} */ catErr) {
        console.warn(`[Category Import] Failed for ${item.slug}:`, catErr?.message || catErr)
      }
    }
  }

  // Pre-fetch all target categories to have as fallbacks if needed
  let fallbackCategoryId = Object.values(idMap.categories)[0] || null
  if (!fallbackCategoryId) {
    try {
      const allCats = await targetPayload.find({ collection: 'skill-categories', limit: 10 })
      if (allCats.docs.length > 0) {
        fallbackCategoryId = allCats.docs[0].id
        for (const cat of allCats.docs) {
          idMap.categories[cat.slug] = cat.id
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Media Metadata & Records
  if (Array.isArray(collections['media'])) {
    for (const item of collections['media']) {
      const oldId = item.id
      try {
        const existing = await targetPayload.find({
          collection: 'media',
          where: {
            and: [
              { filename: { equals: item.filename } },
              { prefix: { equals: item.prefix || 'media' } },
            ],
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          idMap.media[oldId] = existing.docs[0].id
          stats.media++
        } else {
          // Attempt to retrieve existing file bytes from storage bucket
          let fileObj = null
          try {
            const fetched = await fetchSourceFile(item)
            if (fetched?.bytes) {
              fileObj = {
                data: Buffer.from(fetched.bytes),
                mimetype: fetched.contentType || item.mimeType || 'application/octet-stream',
                name: item.filename,
                size: fetched.bytes.length,
              }
            }
          } catch {
            fileObj = {
              data: Buffer.from(''),
              mimetype: item.mimeType || 'application/octet-stream',
              name: item.filename,
              size: item.filesize || 0,
            }
          }

          const created = await targetPayload.create({
            collection: 'media',
            data: {
              alt: item.alt || item.filename,
              prefix: item.prefix || 'media',
            },
            file: fileObj,
          })
          idMap.media[oldId] = created.id
          stats.media++
        }
      } catch (/** @type {any} */ mediaErr) {
        console.warn(`[Media Import] Skipped media ${item.filename}:`, mediaErr?.message || mediaErr)
      }
    }
  }

  // 3. Skills
  if (Array.isArray(collections['skills'])) {
    for (const item of collections['skills']) {
      const oldId = item.id
      try {
        const rawCategories = Array.isArray(item.categories) ? item.categories : []
        let mappedCategories = rawCategories.map((/** @type {any} */ c) => {
          const catId = typeof c === 'object' && c !== null ? c?.id : c
          const catSlug = typeof c === 'object' && c !== null ? c?.slug : null
          return idMap.categories[catId] || (catSlug ? idMap.categories[catSlug] : null) || null
        }).filter(Boolean)

        if (mappedCategories.length === 0 && fallbackCategoryId) {
          mappedCategories = [fallbackCategoryId]
        }

        const rawIconId = typeof item.icon === 'object' && item.icon !== null ? item.icon?.id : item.icon
        const mappedIcon = rawIconId && idMap.media[rawIconId] ? idMap.media[rawIconId] : undefined

        const existing = await targetPayload.find({
          collection: 'skills',
          where: { name: { equals: item.name } },
          limit: 1,
        })

        const skillData = {
          name: item.name,
          categories: mappedCategories,
          percent: item.percent ?? 80,
          color: item.color || '#38bdf8',
          ...(mappedIcon ? { icon: mappedIcon } : {}),
          iconUrl: item.iconUrl || '',
          sortOrder: item.sortOrder ?? 0,
          showInFrontend: item.showInFrontend ?? true,
        }

        if (existing.docs.length > 0) {
          const updated = await targetPayload.update({
            collection: 'skills',
            id: existing.docs[0].id,
            data: skillData,
          })
          idMap.skills[oldId] = updated.id
          stats.skills++
        } else {
          const created = await targetPayload.create({
            collection: 'skills',
            data: skillData,
          })
          idMap.skills[oldId] = created.id
          stats.skills++
        }
      } catch (/** @type {any} */ skillErr) {
        console.warn(`[Skill Import] Failed for ${item.name}:`, skillErr?.message || skillErr)
      }
    }
  }

  // 4. Projects
  if (Array.isArray(collections['projects'])) {
    for (const item of collections['projects']) {
      try {
        const rawImageId = typeof item.image === 'object' && item.image !== null ? item.image?.id : item.image
        const mappedImage = rawImageId && idMap.media[rawImageId] ? idMap.media[rawImageId] : undefined

        const existing = await targetPayload.find({
          collection: 'projects',
          where: { slug: { equals: item.slug } },
          limit: 1,
        })

        const projectData = {
          title: item.title,
          slug: item.slug,
          description: item.description,
          ...(mappedImage ? { image: mappedImage } : {}),
          imageUrl: item.imageUrl || '',
          featured: item.featured ?? true,
          sortOrder: item.sortOrder ?? 0,
          buttons: Array.isArray(item.buttons) ? item.buttons : [],
          readmeContent: item.readmeContent || item.details || '',
        }

        if (existing.docs.length > 0) {
          await targetPayload.update({
            collection: 'projects',
            id: existing.docs[0].id,
            data: projectData,
          })
          stats.projects++
        } else {
          await targetPayload.create({
            collection: 'projects',
            data: projectData,
          })
          stats.projects++
        }
      } catch (/** @type {any} */ projErr) {
        console.warn(`[Project Import] Failed for ${item.slug}:`, projErr?.message || projErr)
      }
    }
  }

  // 5. Education
  if (Array.isArray(collections['education'])) {
    for (const item of collections['education']) {
      try {
        const rawLogoId = typeof item.logo === 'object' && item.logo !== null ? item.logo?.id : item.logo
        const mappedLogo = rawLogoId && idMap.media[rawLogoId] ? idMap.media[rawLogoId] : undefined

        const existing = await targetPayload.find({
          collection: 'education',
          where: {
            and: [
              { name: { equals: item.name } },
              { period: { equals: item.period } },
            ],
          },
          limit: 1,
        })

        const eduData = {
          name: item.name,
          description: item.description,
          period: item.period,
          ...(mappedLogo ? { logo: mappedLogo } : {}),
          logoUrl: item.logoUrl || '',
          sortOrder: item.sortOrder ?? 0,
        }

        if (existing.docs.length > 0) {
          await targetPayload.update({
            collection: 'education',
            id: existing.docs[0].id,
            data: eduData,
          })
          stats.education++
        } else {
          await targetPayload.create({
            collection: 'education',
            data: eduData,
          })
          stats.education++
        }
      } catch (/** @type {any} */ eduErr) {
        console.warn(`[Education Import] Failed for ${item.name}:`, eduErr?.message || eduErr)
      }
    }
  }

  // 6. Profile Global
  if (globals?.profile) {
    try {
      const p = globals.profile
      const rawAvatarId = typeof p.avatar === 'object' && p.avatar !== null ? p.avatar?.id : p.avatar
      const mappedAvatar = rawAvatarId && idMap.media[rawAvatarId] ? idMap.media[rawAvatarId] : undefined

      const cleanProfileData = { ...p }
      delete cleanProfileData.id
      delete cleanProfileData._id
      delete cleanProfileData.updatedAt
      delete cleanProfileData.createdAt

      if (mappedAvatar) {
        cleanProfileData.avatar = mappedAvatar
      } else {
        delete cleanProfileData.avatar
      }

      await targetPayload.updateGlobal({
        slug: 'profile',
        data: cleanProfileData,
      })
      stats.profileUpdated = true
    } catch (/** @type {any} */ profErr) {
      console.warn('[Profile Import] Failed:', profErr?.message || profErr)
    }
  }

  return stats
}

/**
 * Formats database errors into user-friendly diagnostic messages
 * @param {any} err
 */
function formatDbErrorMessage(err) {
  const msg = err?.message || 'Database operation failed.'
  if (msg.includes('ETIMEDOUT') || msg.includes('serverSelectionTimeoutMS') || msg.includes('timed out')) {
    return 'Connection timed out: In MongoDB Atlas, ensure your current IP address is whitelisted in "Network Access" (or set to 0.0.0.0/0 to allow anywhere).'
  }
  if (msg.includes('bad auth') || msg.includes('authentication failed')) {
    return 'Database authentication failed: Please check your database username and password in the connection string.'
  }
  return msg
}

/**
 * POST /api/migration/test-db
 * Tests connection to a target database URL (PostgreSQL or MongoDB)
 * @param {import('payload').PayloadRequest} req
 */
export async function handleTestDatabase(req) {
  const authErr = await ensureAdmin(req)
  if (authErr) return authErr

  try {
    const { databaseUrl } = await req.json()
    if (!databaseUrl?.trim()) {
      return Response.json(
        { success: false, error: 'Database connection string is required.' },
        { status: 400 }
      )
    }

    const cleanUrl = databaseUrl.trim()
    const isPostgres = cleanUrl.startsWith('postgres://') || cleanUrl.startsWith('postgresql://')
    const isMongo = cleanUrl.startsWith('mongodb://') || cleanUrl.startsWith('mongodb+srv://')

    if (!isPostgres && !isMongo) {
      return Response.json(
        {
          success: false,
          error: 'Unsupported URL protocol. Must start with postgresql:// or mongodb:// (or mongodb+srv://).',
        },
        { status: 400 }
      )
    }

    const targetPayload = await getTargetPayload(cleanUrl)
    const testResult = await targetPayload.find({ collection: 'skills', limit: 1 })
    const dbType = isPostgres ? 'PostgreSQL' : 'MongoDB'

    return Response.json({
      success: true,
      type: dbType,
      message: `Connection successful! Target ${dbType} database is active and responsive.`,
      existingSkills: testResult.totalDocs,
    })
  } catch (/** @type {any} */ err) {
    return Response.json(
      { success: false, error: formatDbErrorMessage(err) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/migration/direct-migrate-db
 * Directly copies all collections and globals from current active DB (or optional source DB) into the target DB
 * @param {import('payload').PayloadRequest} req
 */
export async function handleDirectMigrateDb(req) {
  const authErr = await ensureAdmin(req)
  if (authErr) return authErr

  try {
    const { targetDatabaseUrl, sourceDatabaseUrl } = await req.json()

    if (!targetDatabaseUrl?.trim()) {
      return Response.json(
        { success: false, error: 'Target database connection string is required.' },
        { status: 400 }
      )
    }

    const cleanTargetUrl = targetDatabaseUrl.trim()

    // 1. Determine source Payload instance
    const sourcePayload = sourceDatabaseUrl?.trim()
      ? await getTargetPayload(sourceDatabaseUrl.trim())
      : req.payload

    // 2. Extract complete snapshot from source
    const [categories, skills, projects, education, media, profile, users] = await Promise.all([
      sourcePayload.find({ collection: 'skill-categories', limit: 1000 }),
      sourcePayload.find({ collection: 'skills', limit: 1000 }),
      sourcePayload.find({ collection: 'projects', limit: 1000 }),
      sourcePayload.find({ collection: 'education', limit: 1000 }),
      sourcePayload.find({ collection: 'media', limit: 1000 }),
      sourcePayload.findGlobal({ slug: 'profile' }),
      sourcePayload.find({ collection: 'users', limit: 100, showHiddenFields: true }),
    ])

    const safeUsers = (users?.docs || []).map((/** @type {any} */ u) => ({
      email: u.email,
      hash: u.hash,
      salt: u.salt,
    }))

    const dump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      collections: {
        'skill-categories': categories.docs || [],
        skills: skills.docs || [],
        projects: projects.docs || [],
        education: education.docs || [],
        media: media.docs || [],
        users: safeUsers,
      },
      globals: {
        profile,
      },
    }

    // 3. Connect to target DB and execute import
    const targetPayload = await getTargetPayload(cleanTargetUrl)
    const stats = await executeDumpImport(targetPayload, dump)

    const isTargetPostgres = cleanTargetUrl.startsWith('postgres://') || cleanTargetUrl.startsWith('postgresql://')
    const targetType = isTargetPostgres ? 'PostgreSQL' : 'MongoDB'

    const envSnippet = `DATABASE_URL="${cleanTargetUrl}"`

    return Response.json({
      success: true,
      message: `Direct migration to ${targetType} completed successfully!`,
      stats,
      targetType,
      envSnippet,
    })
  } catch (/** @type {any} */ err) {
    return Response.json(
      { success: false, error: formatDbErrorMessage(err) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/migration/import-db
 * Imports collections & globals from an uploaded JSON dump with ID mapping.
 * If targetDatabaseUrl is provided, imports directly into that database without touching .env.
 * @param {import('payload').PayloadRequest} req
 */
export async function handleImportDb(req) {
  const authErr = await ensureAdmin(req)
  if (authErr) return authErr

  try {
    /** @type {any} */
    const body = await req.json()
    const { dump, targetDatabaseUrl } = body

    if (!dump || !dump.collections) {
      return Response.json(
        { error: 'Invalid database dump format. Expected "collections" property.' },
        { status: 400 }
      )
    }

    let destPayload = req.payload
    let envSnippet = undefined
    let targetType = undefined

    if (targetDatabaseUrl?.trim()) {
      const cleanUrl = targetDatabaseUrl.trim()
      destPayload = await getTargetPayload(cleanUrl)
      const isPostgres = cleanUrl.startsWith('postgres://') || cleanUrl.startsWith('postgresql://')
      targetType = isPostgres ? 'PostgreSQL' : 'MongoDB'
      envSnippet = `DATABASE_URL="${cleanUrl}"`
    }

    const stats = await executeDumpImport(destPayload, dump)

    return Response.json({
      success: true,
      message: targetDatabaseUrl?.trim()
        ? `Database dump imported into target ${targetType} successfully!`
        : 'Database import into active database completed successfully!',
      stats,
      targetType,
      envSnippet,
    })
  } catch (/** @type {any} */ err) {
    return Response.json(
      { error: formatDbErrorMessage(err) },
      { status: 500 }
    )
  }
}
