import { getPayload } from 'payload'
import config from '../payload.config.js'

export function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return url
  // Rewrite hardcoded local MinIO host addresses to local relative path
  if (url.includes('localhost:9000/my-portfolio/')) {
    return url.replace(/^https?:\/\/localhost:9000\/my-portfolio\//, '/my-portfolio/')
  }
  if (url.includes('127.0.0.1:9000/my-portfolio/')) {
    return url.replace(/^https?:\/\/127.0.0.1:9000\/my-portfolio\//, '/my-portfolio/')
  }
  if (url.includes('s3:9000/my-portfolio/')) {
    return url.replace(/^https?:\/\/s3:9000\/my-portfolio\//, '/my-portfolio/')
  }
  return url
}

export function sanitizeDocMedia(doc) {
  if (!doc || typeof doc !== 'object') return doc
  if (doc.image) {
    if (typeof doc.image === 'object' && doc.image !== null) {
      if (doc.image.url) doc.image.url = normalizeMediaUrl(doc.image.url)
    } else if (typeof doc.image === 'string') {
      doc.image = normalizeMediaUrl(doc.image)
    }
  }
  if (doc.imageUrl) doc.imageUrl = normalizeMediaUrl(doc.imageUrl)
  if (doc.img) doc.img = normalizeMediaUrl(doc.img)
  if (doc.avatar) {
    if (typeof doc.avatar === 'object' && doc.avatar !== null) {
      if (doc.avatar.url) doc.avatar.url = normalizeMediaUrl(doc.avatar.url)
    } else if (typeof doc.avatar === 'string') {
      doc.avatar = normalizeMediaUrl(doc.avatar)
    }
  }
  if (doc.avatarUrl) doc.avatarUrl = normalizeMediaUrl(doc.avatarUrl)
  if (doc.icon) {
    if (typeof doc.icon === 'object' && doc.icon !== null) {
      if (doc.icon.url) doc.icon.url = normalizeMediaUrl(doc.icon.url)
    } else if (typeof doc.icon === 'string') {
      doc.icon = normalizeMediaUrl(doc.icon)
    }
  }
  if (doc.iconUrl) doc.iconUrl = normalizeMediaUrl(doc.iconUrl)
  return doc
}

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
      .map(({ readmeContent: _readmeContent, ...cardData }) => sanitizeDocMedia(cardData))
  }
  if (Array.isArray(profile?.allProjectsOrder)) {
    profile.allProjectsOrder = profile.allProjectsOrder
      .filter((p) => p && typeof p === 'object')
      .map(({ readmeContent: _readmeContent, ...cardData }) => sanitizeDocMedia(cardData))
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
    skillsDocs = (skillsRes.docs || [])
      .filter((skill) => skill.showInFrontend !== false)
      .map(sanitizeDocMedia)
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
    projectsDocs = profile.featuredProjects
      .filter((p) => p && typeof p === 'object' && p._status !== 'draft')
      .map(sanitizeDocMedia)
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
        .map(({ readmeContent: _readmeContent, ...cardData }) => sanitizeDocMedia(cardData))
    } catch (e) {
      console.warn('Failed to load Projects collection:', e.message)
    }
  }

  const sanitizedProfile = profile
    ? sanitizeDocMedia({
        ...profile,
        allProjectsOrder: undefined,
        featuredProjects: (profile.featuredProjects || []).map((p) => ({
          id: typeof p === 'object' && p !== null ? p.id : p,
        })),
      })
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
 * Fetch portfolio data directly from database.
 */
export async function getPortfolioData() {
  return fetchPortfolioDataFromDb()
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
      .map(({ readmeContent: _readmeContent, ...cardData }) => cardData)
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
      .map(({ readmeContent: _readmeContent, ...cardData }) => cardData)
  }
  if (Array.isArray(profile?.allProjectsOrder)) {
    profile.allProjectsOrder = profile.allProjectsOrder
      .filter((p) => p && typeof p === 'object')
      .map(({ readmeContent: _readmeContent, ...cardData }) => cardData)
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
    ? sanitizeDocMedia({
        ...profile,
        allProjectsOrder: undefined,
        featuredProjects: (profile.featuredProjects || []).map((p) => ({
          id: typeof p === 'object' && p !== null ? p.id : p,
        })),
      })
    : {}

  return {
    projects: orderedProjects.map(sanitizeDocMedia),
    profile: sanitizedProfile,
  }
}

/**
 * Fetch all projects directly from database.
 */
export async function getAllProjects() {
  return fetchAllProjectsFromDb()
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
      return sanitizeDocMedia(doc)
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
      return sanitizeDocMedia(matched)
    }
  } catch (e) {
    console.warn(`Failed to find project with slug ${slug}:`, e.message)
  }

  return null
}

/**
 * Fetch a single project by slug directly from database.
 */
export async function getProjectBySlug(slug) {
  if (!slug) return null
  return fetchProjectBySlugFromDb(slug)
}
