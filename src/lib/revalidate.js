let revalidatePath = () => {}
let revalidateTag = () => {}

try {
  const cache = await import('next/cache.js').catch(() => import('next/cache'))
  if (cache?.revalidatePath) revalidatePath = cache.revalidatePath
  if (cache?.revalidateTag) revalidateTag = cache.revalidateTag
} catch (e) {
  // Standalone node environment fallback
}

export const revalidateAll = () => {
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
}

export const revalidateProject = (slug) => {
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
}
