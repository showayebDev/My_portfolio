import { getPayload } from 'payload'
import config from '@/payload.config.js'
import { rememberCache } from './redis.js'

async function getSafePayload() {
  try {
    const payloadConfig = await config
    return await getPayload({ config: payloadConfig })
  } catch (err) {
    console.warn('Payload CMS connection unavailable:', err?.message || err)
    return null
  }
}

/**
 * Direct database query for full portfolio data.
 */
async function fetchPortfolioDataFromDb() {
  const payload = await getSafePayload()
  if (!payload) {
    return {
      profile: {},
      education: [],
      skills: [],
      projects: [],
    }
  }

  let profile = null
  try {
    profile = await payload.findGlobal({
      slug: 'profile',
      depth: 1,
    })
  } catch (e) {
    console.warn('Failed to load Profile global:', e.message)
  }

  let educationDocs = []
  try {
    const educationRes = await payload.find({
      collection: 'education',
      sort: '-sortOrder',
      limit: 100,
      depth: 1,
    })
    educationDocs = educationRes.docs || []
  } catch (e) {
    console.warn('Failed to load Education collection:', e.message)
  }

  let skillsDocs = []
  try {
    const skillsRes = await payload.find({
      collection: 'skills',
      sort: 'sortOrder',
      limit: 100,
      depth: 1,
    })
    skillsDocs = (skillsRes.docs || []).filter(
      (skill) => skill.showInFrontend !== false
    )
  } catch (e) {
    console.warn('Failed to load Skills collection:', e.message)
  }

  let categoriesDocs = []
  try {
    const categoriesRes = await payload.find({
      collection: 'skill-categories',
      sort: 'sortOrder',
      limit: 100,
      depth: 1,
    })
    categoriesDocs = categoriesRes.docs || []
  } catch (e) {
    console.warn('Failed to load SkillCategories collection:', e.message)
  }

  let projectsDocs = []
  try {
    const projectsRes = await payload.find({
      collection: 'projects',
      where: {
        _status: {
          not_equals: 'draft',
        },
        featured: {
          not_equals: false,
        },
      },
      sort: '-sortOrder',
      limit: 100,
      depth: 1,
    })
    projectsDocs = (projectsRes.docs || [])
      .filter((p) => p._status !== 'draft' && p.featured !== false)
      .map(({ readmeContent, ...cardData }) => cardData)
  } catch (e) {
    console.warn('Failed to load Projects collection:', e.message)
  }

  return {
    profile: profile || {},
    education: educationDocs,
    skills: skillsDocs,
    categories: categoriesDocs,
    projects: projectsDocs,
  }
}

/**
 * Fetch portfolio data with Redis cache-aside (1 hour TTL).
 * Checks Redis first; if miss, fetches from DB, saves to Redis, and returns.
 * If Redis is disabled (USE_REDIS=false) or errors, cleanly falls back to DB.
 */
export async function getPortfolioData() {
  return rememberCache('portfolio:all', 3600, fetchPortfolioDataFromDb)
}

/**
 * Direct database query for all published projects.
 * Excludes heavy readmeContent (markdown docs) so the list cache stays lightweight (~3-5 KB instead of 50+ KB).
 */
async function fetchAllProjectsFromDb() {
  const payload = await getSafePayload()
  if (!payload) {
    return { projects: [], profile: {} }
  }

  let projectsDocs = []
  try {
    const projectsRes = await payload.find({
      collection: 'projects',
      where: {
        _status: {
          not_equals: 'draft',
        },
      },
      sort: '-sortOrder',
      limit: 100,
      depth: 1,
    })
    projectsDocs = (projectsRes.docs || [])
      .filter((p) => p._status !== 'draft')
      .map(({ readmeContent, ...cardData }) => cardData)
  } catch (e) {
    console.warn('Failed to load Projects collection:', e.message)
  }

  let profile = null
  try {
    profile = await payload.findGlobal({
      slug: 'profile',
      depth: 1,
    })
  } catch (e) {
    console.warn('Failed to load Profile global:', e.message)
  }

  return {
    projects: projectsDocs,
    profile: profile || {},
  }
}

/**
 * Fetch all projects with Redis caching (1 hour TTL).
 */
export async function getAllProjects() {
  return rememberCache('portfolio:projects:all', 3600, fetchAllProjectsFromDb)
}

/**
 * Direct database query for a single project by slug.
 */
async function fetchProjectBySlugFromDb(slug) {
  const payload = await getSafePayload()
  if (!payload) {
    return null
  }

  try {
    const projectsRes = await payload.find({
      collection: 'projects',
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
      depth: 1,
    })

    if (projectsRes.docs && projectsRes.docs.length > 0) {
      const doc = projectsRes.docs[0]
      if (doc._status === 'draft') {
        return null
      }
      return doc
    }

    // Try finding case-insensitively across projects
    const allRes = await payload.find({
      collection: 'projects',
      limit: 100,
      depth: 1,
    })

    const matched = allRes.docs.find(
      (p) => (p.slug || p.name)?.toLowerCase() === (slug || '').toLowerCase()
    )
    if (matched) {
      if (matched._status === 'draft') {
        return null
      }
      return matched
    }
  } catch (e) {
    console.warn(`Failed to find project with slug ${slug}:`, e.message)
  }

  return null
}

/**
 * Fetch a single project by slug with Redis caching (1 hour TTL).
 */
export async function getProjectBySlug(slug) {
  if (!slug) return null
  const cacheKey = `portfolio:project:${String(slug).toLowerCase()}`
  return rememberCache(cacheKey, 3600, () => fetchProjectBySlugFromDb(slug))
}
