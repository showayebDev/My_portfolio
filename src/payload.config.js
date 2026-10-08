// @ts-check
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { Users } from './collections/Users.js'
import { Media } from './collections/Media.js'
import { Projects } from './collections/Projects.js'
import { Skills } from './collections/Skills.js'
import { SkillCategories } from './collections/SkillCategories.js'
import { Education } from './collections/Education.js'
import { Profile } from './globals/Profile.js'
import { ensurePostgresSchema } from './lib/autoInitPostgres.js'
import {
  handleGetStatus,
  handleTestBucket,
  handleTransferBucket,
  handleDownloadZip,
  handleExportDb,
  handleImportDb,
  handleTestDatabase,
  handleDirectMigrateDb,
} from './endpoints/migration.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isProduction = process.env.NODE_ENV === 'production'

/**
 * @param {string} level
 * @param {typeof console.log} fn
 */
const createLog =
  (level, fn) =>
  /**
   * @param {object | string} objOrMsg
   * @param {string} [msg]
   */
  (objOrMsg, msg) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (/** @type {{ msg?: string }} */ (objOrMsg)).msg }))
    }
  }

const appLogger = /** @type {any} */ ({
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
})
const siteUrl = (
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  ''
).replace(/\/$/, '')

const trustedDomains = Array.from(
  new Set(
    [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://my-app.showayeb.workers.dev',
      'https://payload-portfolio-wine.vercel.app',
      siteUrl,
      process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '') : '',
      process.env.NEXT_PUBLIC_SERVER_URL ? process.env.NEXT_PUBLIC_SERVER_URL.replace(/\/$/, '') : '',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '',
      process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : '',
    ].filter(Boolean)
  )
)

export default buildConfig({
  serverURL: siteUrl || undefined,
  cors: trustedDomains.length > 0 ? trustedDomains : '*',
  csrf: trustedDomains,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['@/components/admin/MigrationNavLink#MigrationNavLink'],
      views: {
        migration: {
          Component: '@/components/admin/MigrationAdminView#MigrationAdminView',
          path: '/migration',
          meta: {
            title: 'Migration & Backup Center',
          },
        },
      },
    },
  },
  collections: [Users, Media, Projects, Skills, SkillCategories, Education],
  globals: [Profile],
  email: () => ({
    name: 'console',
    defaultFromAddress: 'noreply@localhost',
    defaultFromName: 'Portfolio Admin',
    sendEmail: async (message) => {
      const urlMatch = typeof message.html === 'string' ? message.html.match(/https?:\/\/[^\s"'>]+/i) : null
      const resetLink = urlMatch ? urlMatch[0] : null

      console.log('\n======================================================')
      console.log('📧 [PAYLOAD EMAIL - CONSOLE ADAPTER]')
      console.log(`👤 To:      ${message.to}`)
      console.log(`📋 Subject: ${message.subject}`)
      if (resetLink) {
        console.log(`🔗 Reset Link: ${resetLink}`)
      }
      console.log('======================================================\n')
      return Promise.resolve()
    },
  }),
  endpoints: [
    { path: '/migration/status', method: 'get', handler: handleGetStatus },
    { path: '/migration/test-bucket', method: 'post', handler: handleTestBucket },
    { path: '/migration/transfer-bucket', method: 'post', handler: handleTransferBucket },
    { path: '/migration/download-zip', method: 'get', handler: handleDownloadZip },
    { path: '/migration/export-db', method: 'get', handler: handleExportDb },
    { path: '/migration/import-db', method: 'post', handler: handleImportDb },
    { path: '/migration/test-db', method: 'post', handler: handleTestDatabase },
    { path: '/migration/direct-migrate-db', method: 'post', handler: handleDirectMigrateDb },
  ],
  onInit: async (payload) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        const { totalDocs } = await payload.find({
          collection: 'skill-categories',
          limit: 1,
        })
        if (totalDocs === 0) {
          const defaults = [
            { name: 'Front-end', slug: 'front-end', sortOrder: 1 },
            { name: 'Back-end', slug: 'back-end', sortOrder: 2 },
            { name: 'Framework', slug: 'framework', sortOrder: 3 },
            { name: 'Language', slug: 'language', sortOrder: 4 },
            { name: 'Database', slug: 'database', sortOrder: 5 },
            { name: 'Auth/Services', slug: 'auth-services', sortOrder: 6 },
            { name: 'Tools', slug: 'tools', sortOrder: 7 },
          ]
          for (const item of defaults) {
            await payload.create({
              collection: 'skill-categories',
              data: item,
            })
          }
        }
      } catch (/** @type {any} */ err) {
        console.warn('Skill categories auto-seed skipped:', err?.message || err)
      }
    }
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: (() => {
    const dbUrl = (process.env.DATABASE_URL || process.env.MONGODB_URI || '').trim()
    const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')

    if (isPostgres) {
      const adapterObj = postgresAdapter({
        pool: {
          connectionString: dbUrl,
          ssl: {
            rejectUnauthorized: false,
          },
        },
        push: false,
      })

      const origInit = adapterObj.init
      adapterObj.init = function ({ payload }) {
        const adapter = origInit({ payload })
        const origConnect = adapter.connect
        adapter.connect = async function (options) {
          await ensurePostgresSchema(dbUrl)
          return origConnect.call(this, options)
        }
        return adapter
      }

      return adapterObj
    }

    return mongooseAdapter({
      url: dbUrl || 'mongodb://127.0.0.1:27017/portfolio',
    })
  })(),
  logger: isProduction ? appLogger : undefined,
  plugins: [
    ...(Boolean(process.env.S3_BUCKET || process.env.R2_BUCKET)
      ? [
          s3Storage({
            collections: {
              media: {
                ...(process.env.S3_PUBLIC_URL || process.env.R2_PUBLIC_URL
                  ? {
                      disablePayloadAccessControl: true,
                      generateFileURL: ({ filename, prefix }) => {
                        const key = prefix ? `${prefix}/${filename}` : filename
                        const base = (process.env.S3_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')
                        return `${base}/${key}`
                      },
                    }
                  : {
                      generateFileURL: ({ filename, prefix }) => {
                        const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''
                        return `/api/media/file/${encodeURIComponent(filename)}${params}`
                      },
                    }),
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
