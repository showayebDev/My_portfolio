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
      depth: 2,
    })
  } catch (e) {
    console.warn('Failed to load Profile global:', e.message)
  }

  // Sanitize profile relationships so cache remains lightweight (~3-5 KB)
  if (Array.isArray(profile?.featuredProjects)) {
    profile.featuredProjects = profile.featuredProjects
      .filter((p) => p && typeof p === 'object')
      .map(({ readmeContent, ...cardData }) => cardData)
  }
  if (Array.isArray(profile?.allProjectsOrder)) {
    profile.allProjectsOrder = profile.allProjectsOrder
      .filter((p) => p && typeof p === 'object')
      .map(({ readmeContent, ...cardData }) => cardData)
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
  // 1. Prioritize drag-and-drop ordered featured projects from Globals -> Profile & Settings
  if (Array.isArray(profile?.featuredProjects) && profile.featuredProjects.length > 0) {
    projectsDocs = profile.featuredProjects.filter(
      (p) => p && typeof p === 'object' && p._status !== 'draft'
    )
  }

  // 2. Fallback: If no projects selected in Globals, query all published projects sorted by newest first (-createdAt)
  if (projectsDocs.length === 0) {
    try {
      const projectsRes = await payload.find({
        collection: 'projects',
        where: {
          _status: {
            not_equals: 'draft',
          },
        },
        sort: '-createdAt',
        limit: 100,
        depth: 1,
      })
      projectsDocs = (projectsRes.docs || [])
        .filter((p) => p._status !== 'draft')
        .map(({ readmeContent, ...cardData }) => cardData)
    } catch (e) {
      console.warn('Failed to load Projects collection:', e.message)
    }
  }

  const sanitizedProfile = profile
    ? {
        ...profile,
        allProjectsOrder: undefined,
        featuredProjects: (profile.featuredProjects || []).map((p) => ({
          id: typeof p === 'object' && p !== null ? p.id : p,
        })),
      }
    : {}

  return {
    profile: sanitizedProfile,
    education: educationDocs,
    skills: skillsDocs,
    categories: categoriesDocs,
    projects: projectsDocs,
  }
}

/**
 * Fetch portfolio data with Redis cache-aside.
 * TTL is controlled via REDIS_CACHE_TTL_SECONDS in .env (0 = Permanent until edited).
 * Checks Redis first; if miss, fetches from DB, saves to Redis, and returns.
 * If Redis is disabled (USE_REDIS=false) or errors, cleanly falls back to DB.
 */
export async function getPortfolioData() {
  return rememberCache('portfolio:all', fetchPortfolioDataFromDb)
}

/**
 * Direct database query for all published projects.
 * Smart Hybrid Ordering:
 * 1. Featured projects (from Globals -> Profile & Settings) in exact user drag-and-drop order.
 * 2. Remaining projects sorted automatically by newest first (-createdAt).
 * Excludes heavy readmeContent (markdown docs) so the list cache stays lightweight (~3-5 KB instead of 50+ KB).
 */
async function fetchAllProjectsFromDb() {
  const payload = await getSafePayload()
  if (!payload) {
    return { projects: [], profile: {} }
  }

  // 1. Fetch all published projects sorted by newest first (-createdAt)
  let allPublishedDocs = []
  try {
    const projectsRes = await payload.find({
      collection: 'projects',
      where: {
        _status: {
          not_equals: 'draft',
        },
      },
      sort: '-createdAt',
      limit: 100,
      depth: 1,
    })
    allPublishedDocs = (projectsRes.docs || [])
      .filter((p) => p._status !== 'draft')
      .map(({ readmeContent, ...cardData }) => cardData)
  } catch (e) {
    console.warn('Failed to load Projects collection:', e.message)
  }

  // 2. Fetch Profile global with depth: 2 to retrieve featuredProjects with populated data
  let profile = null
  try {
    profile = await payload.findGlobal({
      slug: 'profile',
      depth: 2,
    })
  } catch (e) {
    console.warn('Failed to load Profile global:', e.message)
  }

  // Sanitize profile relationships so cache remains lightweight (~3-5 KB)
  if (Array.isArray(profile?.featuredProjects)) {
    profile.featuredProjects = profile.featuredProjects
      .filter((p) => p && typeof p === 'object')
      .map(({ readmeContent, ...cardData }) => cardData)
  }
  if (Array.isArray(profile?.allProjectsOrder)) {
    profile.allProjectsOrder = profile.allProjectsOrder
      .filter((p) => p && typeof p === 'object')
      .map(({ readmeContent, ...cardData }) => cardData)
  }

  // 3. Smart Hybrid Ordering for /project page:
  // Priority 1: If allProjectsOrder is configured in Globals, use that exact drag-and-drop order first, followed by remaining (-createdAt).
  // Priority 2: Otherwise if featuredProjects is set, use featured projects first, followed by remaining (-createdAt).
  // Priority 3: All published projects sorted by newest first (-createdAt).
  let orderedProjects = []
  if (Array.isArray(profile?.allProjectsOrder) && profile.allProjectsOrder.length > 0) {
    const customList = profile.allProjectsOrder.filter(
      (p) => p && typeof p === 'object' && p._status !== 'draft'
    )
    const customIdSet = new Set(customList.map((p) => p.id))
    const remainingList = allPublishedDocs.filter((p) => !customIdSet.has(p.id))

    orderedProjects = [...customList, ...remainingList]
  } else if (Array.isArray(profile?.featuredProjects) && profile.featuredProjects.length > 0) {
    const featuredList = profile.featuredProjects.filter(
      (p) => p && typeof p === 'object' && p._status !== 'draft'
    )
    const featuredIdSet = new Set(featuredList.map((p) => p.id))
    const remainingList = allPublishedDocs.filter((p) => !featuredIdSet.has(p.id))

    orderedProjects = [...featuredList, ...remainingList]
  } else {
    orderedProjects = allPublishedDocs
  }

  const sanitizedProfile = profile
    ? {
        ...profile,
        allProjectsOrder: undefined,
        featuredProjects: (profile.featuredProjects || []).map((p) => ({
          id: typeof p === 'object' && p !== null ? p.id : p,
        })),
      }
    : {}

  return {
    projects: orderedProjects,
    profile: sanitizedProfile,
  }
}

/**
 * Fetch all projects with Redis caching.
 * TTL is controlled via REDIS_CACHE_TTL_SECONDS in .env (0 = Permanent until edited).
 */
export async function getAllProjects() {
  return rememberCache('portfolio:projects:all', fetchAllProjectsFromDb)
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
 * Fetch a single project by slug with Redis caching.
 * TTL is controlled via REDIS_CACHE_TTL_SECONDS in .env (0 = Permanent until edited).
 */
export async function getProjectBySlug(slug) {
  if (!slug) return null
  const cacheKey = `portfolio:project:${String(slug).toLowerCase()}`
  return rememberCache(cacheKey, () => fetchProjectBySlugFromDb(slug))
}
