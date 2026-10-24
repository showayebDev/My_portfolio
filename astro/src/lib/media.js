import fs from 'node:fs';
import path from 'node:path';

const downloadingPromises = new Map();

/**
 * Extracts clean local web path (e.g. /projects/xyz.webp, /icons/abc.svg)
 * @param {string} rawUrl
 * @returns {string}
 */
export function getLocalMediaPath(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  let pathPart = rawUrl.trim();

  if (pathPart.startsWith('http://') || pathPart.startsWith('https://')) {
    try {
      const parsed = new URL(pathPart);
      pathPart = parsed.pathname;
    } catch {
      return rawUrl;
    }
  }

  // Normalize path and strip proxy prefix if present
  pathPart = pathPart.replace(/^\/my-portfolio\//, '/');
  if (!pathPart.startsWith('/')) {
    pathPart = `/${pathPart}`;
  }

  return pathPart;
}

/**
 * Ensures media file is downloaded dynamically and present in public/ (and dist/ if available).
 * Runs during dev mode or build time.
 * @param {string} rawUrl
 * @returns {Promise<string>}
 */
export async function downloadAndLocalizeMedia(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  const trimmed = rawUrl.trim();
  const localPath = getLocalMediaPath(trimmed);

  const relativeFilePath = localPath.replace(/^\/+/, '');
  const projectRoot = process.cwd().endsWith('/astro') ? process.cwd() : path.resolve(process.cwd(), 'astro');
  const publicDir = path.resolve(projectRoot, 'public');
  const distDir = path.resolve(projectRoot, 'dist');

  const publicFilePath = path.resolve(publicDir, relativeFilePath);
  const distFilePath = path.resolve(distDir, relativeFilePath);

  // 1. If file already exists in public folder
  if (fs.existsSync(publicFilePath)) {
    try {
      if (fs.existsSync(distDir) && !fs.existsSync(distFilePath)) {
        fs.mkdirSync(path.dirname(distFilePath), { recursive: true });
        fs.copyFileSync(publicFilePath, distFilePath);
      }
    } catch (_) {}
    return localPath;
  }

  // 2. Deduplicate concurrent downloads
  if (downloadingPromises.has(trimmed)) {
    return downloadingPromises.get(trimmed);
  }

  const downloadPromise = (async () => {
    const payloadBase = (
      process.env.PAYLOAD_URL ||
      process.env.PUBLIC_PAYLOAD_URL ||
      'https://payload-cms.showayeb.dev'
    ).replace(/\/$/, '');

    // Formulate candidates to fetch from
    const candidateUrls = [
      `${payloadBase}/my-portfolio${localPath}`,
      trimmed,
    ];

    let buffer = null;
    let fetchedUrl = '';

    for (const candidate of candidateUrls) {
      if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) continue;
      try {
        const res = await fetch(candidate);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          fetchedUrl = candidate;
          break;
        }
      } catch (_) {}
    }

    if (buffer) {
      try {
        // Save to public/
        fs.mkdirSync(path.dirname(publicFilePath), { recursive: true });
        fs.writeFileSync(publicFilePath, buffer);
        console.log(`[Media Downloader] ⬇️ Downloaded ${localPath} (${buffer.length} bytes) via ${fetchedUrl}`);

        // Save to dist/ if dist exists
        if (fs.existsSync(distDir)) {
          fs.mkdirSync(path.dirname(distFilePath), { recursive: true });
          fs.writeFileSync(distFilePath, buffer);
        }
      } catch (writeErr) {
        console.warn(`[Media Downloader] ⚠️ Write error for ${localPath}:`, writeErr?.message);
      }
    } else {
      console.warn(`[Media Downloader] ⚠️ Could not download media for: ${trimmed}`);
    }

    return localPath;
  })();

  downloadingPromises.set(trimmed, downloadPromise);
  try {
    return await downloadPromise;
  } finally {
    downloadingPromises.delete(trimmed);
  }
}

/**
 * Synchronous resolver for immediate component renders.
 * If public file exists, returns localPath; otherwise triggers download.
 * @param {string} rawUrl
 * @returns {string}
 */
export function resolveLocalMedia(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  const localPath = getLocalMediaPath(rawUrl);

  // Trigger download asynchronously if missing
  downloadAndLocalizeMedia(rawUrl).catch(() => {});

  return localPath;
}

/**
 * Ensures the latest favicon.ico from R2 / Payload CMS is downloaded directly into
 * public/favicon.ico and dist/favicon.ico on build and dev mode.
 * @returns {Promise<string>}
 */
export async function ensureFaviconDownloaded() {
  const projectRoot = process.cwd().endsWith('/astro') ? process.cwd() : path.resolve(process.cwd(), 'astro');
  const publicDir = path.resolve(projectRoot, 'public');
  const distDir = path.resolve(projectRoot, 'dist');
  const publicFavicon = path.resolve(publicDir, 'favicon.ico');
  const distFavicon = path.resolve(distDir, 'favicon.ico');

  const payloadBase = (
    process.env.PAYLOAD_URL ||
    process.env.PUBLIC_PAYLOAD_URL ||
    'https://payload-cms.showayeb.dev'
  ).replace(/\/$/, '');

  const candidateUrls = [
    `${payloadBase}/my-portfolio/favicon.ico`,
    'https://pub-6434979c26444eb0a2baab22fd4c838f.r2.dev/favicon.ico',
  ];

  for (const candidate of candidateUrls) {
    try {
      const res = await fetch(candidate);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(publicFavicon, buffer);
        console.log(`[Media Downloader] ⬇️ Downloaded favicon.ico (${buffer.length} bytes) via ${candidate}`);

        if (fs.existsSync(distDir)) {
          fs.writeFileSync(distFavicon, buffer);
        }
        return '/favicon.ico';
      }
    } catch (_) {}
  }

  return '/favicon.ico';
}

