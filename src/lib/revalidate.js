import { deleteCache } from './redis.js'

let revalidatePath = () => {}
let revalidateTag = () => {}

try {
  const cache = await import('next/cache.js').catch(() => import('next/cache'))
  if (cache?.revalidatePath) revalidatePath = cache.revalidatePath
  if (cache?.revalidateTag) revalidateTag = cache.revalidateTag
} catch (e) {
  // Standalone node environment fallback
}

/**
 * Warms/regenerates all Redis cache keys by querying fresh data from the database.
 */
export const warmAllCache = async () => {
  try {
    const { getPortfolioData, getAllProjects, getProjectBySlug } = await import('./getPortfolioData.js')

    // 1. Immediately regenerate portfolio:all and portfolio:projects:all
    const [, allProjectsRes] = await Promise.all([
      getPortfolioData(),
      getAllProjects(),
    ])

    // 2. Regenerate all individual project keys (portfolio:project:<slug>)
    const projects = allProjectsRes?.projects || []
    if (Array.isArray(projects) && projects.length > 0) {
      await Promise.all(
        projects.map((p) => {
          const slug = p.slug || p.name
          return slug ? getProjectBySlug(slug) : Promise.resolve(null)
        })
      )
    }
  } catch (err) {
    console.warn('[Redis] Failed to warm cache in warmAllCache:', err?.message || err)
  }
}

/**
 * Warms/regenerates specific project cache and global caches.
 *
 * @param {string} [slug]
 */
export const warmProjectCache = async (slug) => {
  try {
    const { getPortfolioData, getAllProjects, getProjectBySlug } = await import('./getPortfolioData.js')
    await Promise.all([
      getPortfolioData(),
      getAllProjects(),
      slug ? getProjectBySlug(slug) : Promise.resolve(null),
    ])
  } catch (err) {
    console.warn('[Redis] Failed to warm cache in warmProjectCache:', err?.message || err)
  }
}

/**
 * Invalidate all frontend pages and Redis cache keys, then immediately regenerates all keys with fresh data.
 * Called automatically by Payload hooks when collections/globals are updated or deleted.
 */
export const revalidateAll = async () => {
  // 1. Next.js on-demand ISR revalidation
  try {
    revalidatePath('/')
    revalidatePath('/project')
    revalidateTag('portfolio', 'default')
    revalidateTag('profile', 'default')
    revalidateTag('skills', 'default')
    revalidateTag('education', 'default')
    revalidateTag('projects', 'default')
  } catch (e) {
    // If called outside of a Next request context
  }

  // 2. Redis Cache Invalidation
  try {
    await deleteCache([
      'portfolio:all',
      'portfolio:projects:all',
    ])
    // Clear all individual project caches
    await deleteCache('portfolio:project:*')
  } catch (e) {
    console.warn('[Redis] Failed to clear cache in revalidateAll:', e?.message || e)
  }

  // 3. Immediately regenerate all cache keys in Redis
  await warmAllCache()
}

/**
 * Invalidate project specific pages and corresponding Redis cache keys, then immediately regenerates them.
 *
 * @param {string} [slug]
 */
export const revalidateProject = async (slug) => {
  // 1. Next.js path and tag revalidation
  try {
    revalidatePath('/')
    revalidatePath('/project')
    if (slug) {
      revalidatePath(`/project/${slug}`)
    }
    revalidateTag('projects', 'default')
  } catch (e) {
    // Ignore outside request context
  }

  // 2. Redis Cache Invalidation
  try {
    const keysToDelete = ['portfolio:all', 'portfolio:projects:all']
    if (slug) {
      keysToDelete.push(`portfolio:project:${String(slug).toLowerCase()}`)
    }
    await deleteCache(keysToDelete)
  } catch (e) {
    console.warn('[Redis] Failed to clear project cache in revalidateProject:', e?.message || e)
  }

  // 3. Immediately regenerate the affected cache keys in Redis
  await warmProjectCache(slug)
}

/**
 * Standalone function to manually purge/delete Redis cache by key or pattern.
 *
 * @param {string|string[]} keyOrPattern - e.g. 'portfolio:all' or 'portfolio:*'
 * @returns {Promise<boolean>}
 */
export async function invalidateCacheKey(keyOrPattern) {
  return await deleteCache(keyOrPattern)
}

/**
 * Checks if any required portfolio cache keys are missing in Redis.
 * If any missing key is found, immediately regenerates and stores it.
 *
 * @returns {Promise<{
 *   configured: boolean,
 *   allKeysPresent: boolean,
 *   missingKeys: string[],
 *   regeneratedKeys: string[],
 *   totalExpectedKeys: number,
 *   error?: string
 * }>}
 */
export async function checkAndRegenerateMissingKeys() {
  const { isRedisConfigured, getCache } = await import('./redis.js')
  if (!isRedisConfigured()) {
    return {
      configured: false,
      allKeysPresent: false,
      missingKeys: [],
      regeneratedKeys: [],
      totalExpectedKeys: 0,
    }
  }

  const { getPortfolioData, getAllProjects, getProjectBySlug } = await import('./getPortfolioData.js')

  const report = {
    configured: true,
    allKeysPresent: true,
    missingKeys: /** @type {string[]} */ ([]),
    regeneratedKeys: /** @type {string[]} */ ([]),
    totalExpectedKeys: 0,
  }

  try {
    // 1. Check home portfolio key
    const homeCached = await getCache('portfolio:all')
    if (!homeCached) {
      report.missingKeys.push('portfolio:all')
      await getPortfolioData()
      report.regeneratedKeys.push('portfolio:all')
    }

    // 2. Check all projects list key
    const listCached = await getCache('portfolio:projects:all')
    let allProjectsRes = listCached
    if (!listCached) {
      report.missingKeys.push('portfolio:projects:all')
      allProjectsRes = await getAllProjects()
      report.regeneratedKeys.push('portfolio:projects:all')
    } else {
      allProjectsRes = await getAllProjects()
    }

    // 3. Check each published project key
    const projects = allProjectsRes?.projects || []
    report.totalExpectedKeys = 2 + (Array.isArray(projects) ? projects.length : 0)

    if (Array.isArray(projects) && projects.length > 0) {
      for (const p of projects) {
        const slug = p.slug || p.name
        if (!slug) continue
        const key = `portfolio:project:${String(slug).toLowerCase()}`
        const cached = await getCache(key)
        if (!cached) {
          report.missingKeys.push(key)
          await getProjectBySlug(slug)
          report.regeneratedKeys.push(key)
        }
      }
    }

    report.allKeysPresent = report.missingKeys.length === 0
    return report
  } catch (/** @type {any} */ err) {
    console.warn('[Redis Audit] Error during checkAndRegenerateMissingKeys:', err?.message || err)
    return { ...report, error: err?.message || err }
  }
}
