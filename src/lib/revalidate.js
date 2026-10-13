let revalidatePath = () => {}
let revalidateTag = () => {}

try {
  const cache = await import('next/cache.js').catch(() => import('next/cache'))
  if (cache?.revalidatePath) revalidatePath = cache.revalidatePath
  if (cache?.revalidateTag) revalidateTag = cache.revalidateTag
} catch (_e) {
  // Standalone node environment fallback
}

/**
 * Invalidate all frontend pages and tags on Next.js edge.
 * Called automatically by Payload hooks when collections/globals are updated or deleted.
 */
export const revalidateAll = async () => {
  try {
    revalidatePath('/')
    revalidatePath('/project')
    revalidateTag('portfolio', 'default')
    revalidateTag('profile', 'default')
    revalidateTag('skills', 'default')
    revalidateTag('education', 'default')
    revalidateTag('projects', 'default')
  } catch (_e) {
    // If called outside of a Next request context
  }
}

/**
 * Invalidate project specific pages and tags on Next.js edge.
 *
 * @param {string} [slug]
 */
export const revalidateProject = async (slug) => {
  try {
    revalidatePath('/')
    revalidatePath('/project')
    if (slug) {
      revalidatePath(`/project/${slug}`)
    }
    revalidateTag('projects', 'default')
  } catch (_e) {
    // Ignore outside request context
  }
}

/**
 * Standalone helper maintained for backward compatibility.
 */
export async function invalidateCacheKey() {
  return true
}

/**
 * Standalone helper maintained for backward compatibility.
 */
export async function warmAllCache() {
  return true
}

/**
 * Standalone helper maintained for backward compatibility.
 */
export async function warmProjectCache() {
  return true
}

/**
 * Standalone helper maintained for backward compatibility.
 */
export async function checkAndRegenerateMissingKeys() {
  return {
    configured: false,
    allKeysPresent: true,
    missingKeys: [],
    regeneratedKeys: [],
    totalExpectedKeys: 0,
  }
}
