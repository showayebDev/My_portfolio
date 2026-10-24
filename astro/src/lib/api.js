import { resolveLocalMedia, downloadAndLocalizeMedia, getLocalMediaPath, ensureFaviconDownloaded } from './media.js';

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

async function normalizeMediaUrlAsync(url) {
  if (!url || typeof url !== 'string') return url;
  return await downloadAndLocalizeMedia(url);
}

export function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return resolveLocalMedia(url);
}

export async function sanitizeDocMediaAsync(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const clone = { ...doc };
  if (clone.image && typeof clone.image === 'object' && clone.image.url) {
    clone.image.url = await normalizeMediaUrlAsync(clone.image.url);
  } else if (typeof clone.image === 'string') {
    clone.image = await normalizeMediaUrlAsync(clone.image);
  }
  if (clone.imageUrl && typeof clone.imageUrl === 'string') {
    clone.imageUrl = await normalizeMediaUrlAsync(clone.imageUrl);
  }
  if (clone.img && typeof clone.img === 'string') {
    clone.img = await normalizeMediaUrlAsync(clone.img);
  }
  if (clone.avatar && typeof clone.avatar === 'object' && clone.avatar.url) {
    clone.avatar.url = await normalizeMediaUrlAsync(clone.avatar.url);
  }
  if (clone.icon && typeof clone.icon === 'object' && clone.icon.url) {
    clone.icon.url = await normalizeMediaUrlAsync(clone.icon.url);
  }
  if (clone.logo && typeof clone.logo === 'object' && clone.logo.url) {
    clone.logo.url = await normalizeMediaUrlAsync(clone.logo.url);
  }
  if (Array.isArray(clone.socials)) {
    clone.socials = await Promise.all(
      clone.socials.map(async (s) => {
        if (!s || typeof s !== 'object') return s;
        const item = { ...s };
        if (item.icon && typeof item.icon === 'object' && item.icon.url) {
          item.icon = { ...item.icon, url: await normalizeMediaUrlAsync(item.icon.url) };
        } else if (typeof item.icon === 'string') {
          item.icon = await normalizeMediaUrlAsync(item.icon);
        }
        if (item.iconUrl && typeof item.iconUrl === 'string') {
          item.iconUrl = await normalizeMediaUrlAsync(item.iconUrl);
        }
        return item;
      })
    );
  }
  return clone;
}

export function sanitizeDocMedia(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const clone = { ...doc };
  if (clone.image && typeof clone.image === 'object' && clone.image.url) {
    clone.image.url = normalizeMediaUrl(clone.image.url);
  } else if (typeof clone.image === 'string') {
    clone.image = normalizeMediaUrl(clone.image);
  }
  if (clone.imageUrl && typeof clone.imageUrl === 'string') {
    clone.imageUrl = normalizeMediaUrl(clone.imageUrl);
  }
  if (clone.img && typeof clone.img === 'string') {
    clone.img = normalizeMediaUrl(clone.img);
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
  if (Array.isArray(clone.socials)) {
    clone.socials = clone.socials.map((s) => {
      if (!s || typeof s !== 'object') return s;
      const item = { ...s };
      if (item.icon && typeof item.icon === 'object' && item.icon.url) {
        item.icon = { ...item.icon, url: normalizeMediaUrl(item.icon.url) };
      } else if (typeof item.icon === 'string') {
        item.icon = normalizeMediaUrl(item.icon);
      }
      if (item.iconUrl && typeof item.iconUrl === 'string') {
        item.iconUrl = normalizeMediaUrl(item.iconUrl);
      }
      return item;
    });
  }
  return clone;
}

// Server-only runtime secret resolution (never exposed or inlined into client bundles)
const PAYLOAD_SECRET =
  (typeof process !== 'undefined' && process.env?.PAYLOAD_SECRET) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PAYLOAD_SECRET) ||
  '';

export async function fetchFromApi(endpoint) {
  const url = `${INTERNAL_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  try {
    const headers = {
      ...(PAYLOAD_SECRET ? { 'x-payload-secret': PAYLOAD_SECRET } : {}),
    };
    const res = await fetch(url, { headers });
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
  const [data] = await Promise.all([
    fetchFromApi('/api/globals/profile'),
    ensureFaviconDownloaded(),
  ]);
  return data ? await sanitizeDocMediaAsync(data) : {};
}

export async function getEducation() {
  const data = await fetchFromApi('/api/education?sort=-sortOrder&limit=100');
  return await Promise.all((data?.docs || []).map(sanitizeDocMediaAsync));
}

export async function getSkills() {
  const data = await fetchFromApi('/api/skills?sort=sortOrder&limit=100');
  const filtered = (data?.docs || []).filter((s) => s.showInFrontend !== false);
  return await Promise.all(filtered.map(sanitizeDocMediaAsync));
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

  const rawPublished = (projectsRes?.docs || []).filter((p) => p._status !== 'draft');
  const allPublished = await Promise.all(rawPublished.map(sanitizeDocMediaAsync));

  let orderedProjects = allPublished;

  // Respect drag-and-drop order from Profile Globals
  if (Array.isArray(profile?.allProjectsOrder) && profile.allProjectsOrder.length > 0) {
    const rawCustom = profile.allProjectsOrder.filter((p) => p && typeof p === 'object' && p._status !== 'draft');
    const customList = await Promise.all(rawCustom.map(sanitizeDocMediaAsync));
    const customIdSet = new Set(customList.map((p) => p.id));
    const remaining = allPublished.filter((p) => !customIdSet.has(p.id));
    orderedProjects = [...customList, ...remaining];
  } else if (Array.isArray(profile?.featuredProjects) && profile.featuredProjects.length > 0) {
    const rawFeatured = profile.featuredProjects.filter((p) => p && typeof p === 'object' && p._status !== 'draft');
    const featuredList = await Promise.all(rawFeatured.map(sanitizeDocMediaAsync));
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
    const rawFeatured = profile.featuredProjects.filter((p) => p && typeof p === 'object' && p._status !== 'draft');
    featured = await Promise.all(rawFeatured.map(sanitizeDocMediaAsync));
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
    return doc._status !== 'draft' ? await sanitizeDocMediaAsync(doc) : null;
  }

  // Fallback: search case-insensitively across projects
  const allData = await fetchFromApi('/api/projects?limit=100');
  const matched = (allData?.docs || []).find(
    (p) => (p.slug || p.name)?.toLowerCase() === slug.toLowerCase()
  );
  if (matched && matched._status !== 'draft') {
    return await sanitizeDocMediaAsync(matched);
  }

  return null;
}
