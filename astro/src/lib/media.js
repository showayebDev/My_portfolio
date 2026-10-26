import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const downloadingPromises = new Map();
let faviconPromise = null;

function getProjectRoot() {
  let curr = process.cwd();
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'astro', 'package.json'))) {
      return path.join(curr, 'astro');
    }
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(curr, 'package.json'), 'utf-8'));
        if (pkg.name === 'astro' || pkg.name === 'my-portfolio' || pkg.dependencies?.astro) {
          return curr;
        }
      } catch (_) {}
    }
    curr = path.dirname(curr);
  }
  return process.cwd().endsWith('/astro') ? process.cwd() : path.resolve(process.cwd(), 'astro');
}

function getDirectories() {
  const projectRoot = getProjectRoot();
  const publicDir = path.resolve(projectRoot, 'public');
  const distDir = path.resolve(projectRoot, 'dist');
  const clientDir = path.resolve(distDir, 'client');
  return { projectRoot, publicDir, distDir, clientDir };
}

function safeWriteFileSync(filePath, buffer) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  try {
    fs.writeFileSync(tmp, buffer);
    fs.renameSync(tmp, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch (_) {}
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw err;
    }
  }
}

function syncToDist(sourcePath, relativeFilePath) {
  const { distDir, clientDir } = getDirectories();
  const targets = [];
  if (fs.existsSync(distDir)) {
    const target = path.resolve(distDir, relativeFilePath);
    if (target.startsWith(distDir + path.sep)) {
      targets.push(target);
    }
  }
  if (fs.existsSync(clientDir)) {
    const target = path.resolve(clientDir, relativeFilePath);
    if (target.startsWith(clientDir + path.sep)) {
      targets.push(target);
    }
  }

  for (const target of targets) {
    try {
      if (!fs.existsSync(target) || fs.statSync(target).size === 0) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(sourcePath, target);
      }
    } catch (_) {}
  }
}

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
  const { publicDir, distDir, clientDir } = getDirectories();

  const publicFilePath = path.resolve(publicDir, relativeFilePath);
  if (!publicFilePath.startsWith(publicDir + path.sep)) {
    console.warn(`[Media Downloader] ⚠️ Path traversal attempt blocked: ${relativeFilePath}`);
    return localPath;
  }

  // 1. If valid file already exists in public folder, sync to dist and return
  if (fs.existsSync(publicFilePath)) {
    try {
      if (fs.statSync(publicFilePath).size > 0) {
        syncToDist(publicFilePath, relativeFilePath);
        return localPath;
      }
    } catch (_) {}
  }

  // 2. Deduplicate concurrent downloads by localPath
  if (downloadingPromises.has(localPath)) {
    return downloadingPromises.get(localPath);
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

    const payloadSecret =
      typeof process !== 'undefined' && process.env?.PAYLOAD_SECRET
        ? process.env.PAYLOAD_SECRET
        : '';
    const fetchHeaders = payloadSecret ? { 'x-payload-secret': payloadSecret } : {};

/**
 * Safely checks if candidate URL matches internal payload origin.
 * Prevents credential leaking to external domains or subdomain prefixes.
 * @param {string} candidate
 * @param {string} payloadBase
 * @returns {boolean}
 */
function isInternalPayloadUrl(candidate, payloadBase) {
  if (!candidate || !payloadBase) return false;
  try {
    const candidateUrl = new URL(candidate);
    const payloadUrl = new URL(payloadBase);
    return candidateUrl.origin === payloadUrl.origin;
  } catch {
    return false;
  }
}

    for (const candidate of candidateUrls) {
      if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) continue;
      try {
        // Security: Only send internal x-payload-secret to internal payloadBase, never leak to external URLs
        const isInternalPayload = isInternalPayloadUrl(candidate, payloadBase);
        const headers = isInternalPayload ? fetchHeaders : {};
        const res = await fetch(candidate, { headers });
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
        // Atomic save to public/
        safeWriteFileSync(publicFilePath, buffer);
        console.log(`[Media Downloader] ⬇️ Downloaded ${localPath} (${buffer.length} bytes) via ${fetchedUrl}`);

        // Sync to dist/ and dist/client/
        syncToDist(publicFilePath, relativeFilePath);
      } catch (writeErr) {
        console.warn(`[Media Downloader] ⚠️ Write error for ${localPath}:`, writeErr?.message);
      }
    } else {
      console.warn(`[Media Downloader] ⚠️ Could not download media for: ${trimmed}`);
    }

    return localPath;
  })();

  downloadingPromises.set(localPath, downloadPromise);
  try {
    return await downloadPromise;
  } finally {
    downloadingPromises.delete(localPath);
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
  if (faviconPromise) {
    return faviconPromise;
  }

  faviconPromise = (async () => {
    const { publicDir, distDir, clientDir } = getDirectories();
    const publicFavicon = path.resolve(publicDir, 'favicon.ico');
    const distFavicon = path.resolve(distDir, 'favicon.ico');
    const clientFavicon = path.resolve(clientDir, 'favicon.ico');

    // If already downloaded and valid
    if (fs.existsSync(publicFavicon)) {
      try {
        if (fs.statSync(publicFavicon).size > 0) {
          syncToDist(publicFavicon, 'favicon.ico');
          return '/favicon.ico';
        }
      } catch (_) {}
    }

    const payloadBase = (
      process.env.PAYLOAD_URL ||
      process.env.PUBLIC_PAYLOAD_URL ||
      'https://payload-cms.showayeb.dev'
    ).replace(/\/$/, '');

    const candidateUrls = [
      `${payloadBase}/my-portfolio/favicon.ico`,
      'https://pub-6434979c26444eb0a2baab22fd4c838f.r2.dev/favicon.ico',
    ];

    const payloadSecret =
      typeof process !== 'undefined' && process.env?.PAYLOAD_SECRET
        ? process.env.PAYLOAD_SECRET
        : '';
    const fetchHeaders = payloadSecret ? { 'x-payload-secret': payloadSecret } : {};

    for (const candidate of candidateUrls) {
      try {
        const isInternalPayload = isInternalPayloadUrl(candidate, payloadBase);
        const headers = isInternalPayload ? fetchHeaders : {};
        const res = await fetch(candidate, { headers });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          safeWriteFileSync(publicFavicon, buffer);
          console.log(`[Media Downloader] ⬇️ Downloaded favicon.ico (${buffer.length} bytes) via ${candidate}`);

          syncToDist(publicFavicon, 'favicon.ico');
          return '/favicon.ico';
        }
      } catch (_) {}
    }

    return '/favicon.ico';
  })();

  try {
    return await faviconPromise;
  } finally {
    faviconPromise = null;
  }
}

