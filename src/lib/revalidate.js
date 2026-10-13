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
 * Invalidate all frontend pages and Redis cache keys.
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
}

/**
 * Invalidate project specific pages and corresponding Redis cache keys.
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
}

/**
 * Standalone example function to manually purge/delete Redis cache by key or pattern.
 *
 * @param {string|string[]} keyOrPattern - e.g. 'portfolio:all' or 'portfolio:*'
 * @returns {Promise<boolean>}
 */
export async function invalidateCacheKey(keyOrPattern) {
  return await deleteCache(keyOrPattern)
}
