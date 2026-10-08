// @ts-check

/**
 * Normalizes any URL string into a guaranteed valid URL string.
 * - Trims whitespace and newlines (e.g. from copy-pasting into Vercel env settings).
 * - Prepends https:// (or http:// for localhost/127.0.0.1) if missing protocol.
 * - Strips trailing slashes.
 * - Validates using the URL constructor. Returns empty string if invalid.
 *
 * @param {string | undefined | null} [input]
 * @returns {string}
 */
export function sanitizeUrl(input) {
  if (!input || typeof input !== 'string') return ''
  let val = input.trim()
  if (!val) return ''

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(val)) {
    const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(val)
    val = isLocal ? `http://${val}` : `https://${val}`
  }

  try {
    const url = new URL(val)
    const pathname = url.pathname !== '/' ? url.pathname.replace(/\/+$/, '') : ''
    return `${url.origin}${pathname}`
  } catch {
    return ''
  }
}

/**
 * Gets the current site URL, taking into account NEXT_PUBLIC_SITE_URL,
 * Vercel environment variables (VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL),
 * and local fallback.
 *
 * Guaranteed to return a valid URL string that can be parsed by `new URL()`.
 *
 * @returns {string}
 */
export function getSiteUrl() {
  const envUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SITE_URL)
  if (envUrl) return envUrl

  const vercelProd = sanitizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  if (vercelProd) return vercelProd

  const vercelPreview = sanitizeUrl(process.env.VERCEL_URL)
  if (vercelPreview) return vercelPreview

  return 'http://localhost:3000'
}

/**
 * Returns a guaranteed valid URL object for Next.js metadataBase.
 *
 * @returns {URL}
 */
export function getSiteUrlObject() {
  try {
    return new URL(getSiteUrl())
  } catch {
    return new URL('http://localhost:3000')
  }
}
