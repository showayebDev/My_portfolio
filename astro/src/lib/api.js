const INTERNAL_URL = (
  process.env.PAYLOAD_URL ||
  import.meta.env.PAYLOAD_URL ||
  process.env.PUBLIC_PAYLOAD_URL ||
  import.meta.env.PUBLIC_PAYLOAD_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

const PUBLIC_URL = (
  process.env.PUBLIC_PAYLOAD_URL ||
  import.meta.env.PUBLIC_PAYLOAD_URL ||
  INTERNAL_URL
).replace(/\/$/, '');

function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${PUBLIC_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function sanitizeDocMedia(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const clone = { ...doc };
  if (clone.image && typeof clone.image === 'object' && clone.image.url) {
    clone.image.url = normalizeMediaUrl(clone.image.url);
  }
  if (clone.avatar && typeof clone.avatar === 'object' && clone.avatar.url) {
    clone.avatar.url = normalizeMediaUrl(clone.avatar.url);
  }
  if (clone.icon && typeof clone.icon === 'object' && clone.icon.url) {
    clone.icon.url = normalizeMediaUrl(clone.icon.url);
  }
  if (clone.logo && typeof clone.logo === 'object' && clone.logo.url) {
    clone.logo.url = normalizeMediaUrl(clone.logo.url);
  }
  return clone;
}

export async function fetchFromApi(endpoint) {
  const url = `${INTERNAL_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Astro API] Failed fetch ${url}: HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Astro API] Error fetching ${url}:`, err?.message || err);
    return null;
  }
}

export async function getProfile() {
  const data = await fetchFromApi('/api/globals/profile');
  return data ? sanitizeDocMedia(data) : {};
}

export async function getEducation() {
  const data = await fetchFromApi('/api/education?sort=-sortOrder&limit=100');
  return (data?.docs || []).map(sanitizeDocMedia);
}

export async function getSkills() {
  const data = await fetchFromApi('/api/skills?sort=sortOrder&limit=100');
  return (data?.docs || [])
    .filter((s) => s.showInFrontend !== false)
    .map(sanitizeDocMedia);
}

export async function getSkillCategories() {
  const data = await fetchFromApi('/api/skill-categories?sort=sortOrder&limit=100');
  return data?.docs || [];
}

export async function getAllProjects() {
  const [profile, projectsRes] = await Promise.all([
    getProfile(),
    fetchFromApi('/api/projects?where[_status][not_equals]=draft&sort=-createdAt&limit=100'),
  ]);

  const allPublished = (projectsRes?.docs || [])
    .filter((p) => p._status !== 'draft')
    .map(sanitizeDocMedia);

  let orderedProjects = allPublished;

  // Respect drag-and-drop order from Profile Globals
  if (Array.isArray(profile?.allProjectsOrder) && profile.allProjectsOrder.length > 0) {
    const customList = profile.allProjectsOrder
      .filter((p) => p && typeof p === 'object' && p._status !== 'draft')
      .map(sanitizeDocMedia);
    const customIdSet = new Set(customList.map((p) => p.id));
    const remaining = allPublished.filter((p) => !customIdSet.has(p.id));
    orderedProjects = [...customList, ...remaining];
  } else if (Array.isArray(profile?.featuredProjects) && profile.featuredProjects.length > 0) {
    const featuredList = profile.featuredProjects
      .filter((p) => p && typeof p === 'object' && p._status !== 'draft')
      .map(sanitizeDocMedia);
    const featuredIdSet = new Set(featuredList.map((p) => p.id));
    const remaining = allPublished.filter((p) => !featuredIdSet.has(p.id));
    orderedProjects = [...featuredList, ...remaining];
  }

  return {
    profile,
    projects: orderedProjects,
  };
}

export async function getPortfolioData() {
  const [profile, education, skills, categories, projectsData] = await Promise.all([
    getProfile(),
    getEducation(),
    getSkills(),
    getSkillCategories(),
    getAllProjects(),
  ]);

  let featured = [];
  if (Array.isArray(profile?.featuredProjects) && profile.featuredProjects.length > 0) {
    featured = profile.featuredProjects
      .filter((p) => p && typeof p === 'object' && p._status !== 'draft')
      .map(sanitizeDocMedia);
  }
  if (!featured.length) {
    featured = projectsData.projects.slice(0, 6);
  }

  return {
    profile,
    education,
    skills,
    categories,
    projects: featured,
  };
}

export async function getProjectBySlug(slug) {
  if (!slug) return null;
  const data = await fetchFromApi(`/api/projects?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`);
  if (data?.docs?.length > 0) {
    const doc = data.docs[0];
    return doc._status !== 'draft' ? sanitizeDocMedia(doc) : null;
  }

  // Fallback: search case-insensitively across projects
  const allData = await fetchFromApi('/api/projects?limit=100');
  const matched = (allData?.docs || []).find(
    (p) => (p.slug || p.name)?.toLowerCase() === slug.toLowerCase()
  );
  if (matched && matched._status !== 'draft') {
    return sanitizeDocMedia(matched);
  }

  return null;
}
