import { getPayload } from 'payload'
import config from '@/payload.config.js'

async function getSafePayload() {
  try {
    const payloadConfig = await config
    return await getPayload({ config: payloadConfig })
  } catch (err) {
    console.warn('Payload CMS connection unavailable:', err?.message || err)
    return null
  }
}

export async function getPortfolioData() {
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
        sortOrder: {
          not_equals: 0,
        },
      },
      sort: '-sortOrder',
      limit: 100,
      depth: 1,
    })
    projectsDocs = (projectsRes.docs || []).filter(
      (p) => (p.sortOrder ?? p.sort_order ?? 0) !== 0
    )
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

export async function getAllProjects() {
  const payload = await getSafePayload()
  if (!payload) {
    return { projects: [], profile: {} }
  }

  let projectsDocs = []
  try {
    const projectsRes = await payload.find({
      collection: 'projects',
      where: {
        sortOrder: {
          not_equals: 0,
        },
      },
      sort: '-sortOrder',
      limit: 100,
      depth: 1,
    })
    projectsDocs = (projectsRes.docs || []).filter(
      (p) => (p.sortOrder ?? p.sort_order ?? 0) !== 0
    )
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

export async function getProjectBySlug(slug) {
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
      if ((doc.sortOrder ?? doc.sort_order ?? 0) === 0) {
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
      if ((matched.sortOrder ?? matched.sort_order ?? 0) === 0) {
        return null
      }
      return matched
    }
  } catch (e) {
    console.warn(`Failed to find project with slug ${slug}:`, e.message)
  }

  return null
}
