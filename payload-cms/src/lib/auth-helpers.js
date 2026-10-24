import { jwtVerify } from 'jose'

const textEncoder = new TextEncoder()

/**
 * Constant-time comparison using Web Crypto SHA-256 digests.
 * Uses global crypto.subtle (Edge Runtime, Node.js, Webpack, Cloudflare Workers universal standard).
 * Prevents timing attacks and length leakage with constant-time XOR comparison over fixed 32-byte hashes.
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 * @returns {Promise<boolean>}
 */
export async function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) {
    return false
  }
  try {
    const aBytes = textEncoder.encode(a)
    const bBytes = textEncoder.encode(b)

    const [hashABuf, hashBBuf] = await Promise.all([
      crypto.subtle.digest('SHA-256', aBytes),
      crypto.subtle.digest('SHA-256', bBytes),
    ])

    const hashA = new Uint8Array(hashABuf)
    const hashB = new Uint8Array(hashBBuf)

    let diff = 0
    for (let i = 0; i < 32; i++) {
      diff |= hashA[i] ^ hashB[i]
    }
    return diff === 0
  } catch {
    return false
  }
}

/**
 * Robustly parses and normalizes Bearer token from Authorization header.
 * Case-insensitive scheme and whitespace tolerant.
 * @param {string | null | undefined} authHeader
 * @returns {string | null}
 */
export function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null
  const parts = authHeader.trim().split(/\s+/)
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1]
  }
  return null
}

/**
 * Parses a specific cookie value from a raw Cookie header string.
 * @param {string | null | undefined} cookieHeader
 * @param {string} cookieName
 * @returns {string | null}
 */
export function parseCookie(cookieHeader, cookieName) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1].trim()).replace(/^"|"$/g, '')
  } catch {
    return match[1].trim().replace(/^"|"$/g, '')
  }
}

/**
 * Derives the 32-character HMAC secret key Payload CMS uses for signing and verifying JWT tokens.
 * In Payload CMS: this.secret = crypto.createHash('sha256').update(this.config.secret).digest('hex').slice(0, 32);
 * Implemented using Web Crypto (crypto.subtle) for universal Edge Runtime & Node.js compatibility.
 * @param {string} rawSecret
 * @returns {Promise<string | null>}
 */
export async function derivePayloadJwtSecret(rawSecret) {
  if (typeof rawSecret !== 'string' || !rawSecret) return null
  try {
    const bytes = textEncoder.encode(rawSecret)
    const hashBuf = await crypto.subtle.digest('SHA-256', bytes)
    const hashArr = Array.from(new Uint8Array(hashBuf))
    const hashHex = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('')
    return hashHex.slice(0, 32)
  } catch {
    return null
  }
}

/**
 * Cryptographically verifies if the payload-token JWT was genuinely signed with PAYLOAD_SECRET.
 * Verifies against both Payload CMS's native derived secret (SHA-256 hex sliced to 32 chars)
 * and direct raw secret for backwards/test compatibility.
 * Rejects forged, expired, or tampered cookies.
 * @param {string | null | undefined} token
 * @param {string | null | undefined} secret
 * @returns {Promise<boolean>}
 */
export async function verifyAdminSession(token, secret) {
  if (!token || typeof token !== 'string' || !secret || typeof secret !== 'string') {
    return false
  }

  const cleanToken = token.trim().replace(/^"|"$/g, '')
  if (!cleanToken) return false

  // 1. Primary: Verify against Payload CMS's native derived secret
  try {
    const derivedSecret = await derivePayloadJwtSecret(secret)
    if (derivedSecret) {
      const derivedKey = textEncoder.encode(derivedSecret)
      const { payload } = await jwtVerify(cleanToken, derivedKey, { algorithms: ['HS256'] })
      if (payload && (payload.id != null || payload.email != null)) {
        return true
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Fallback: Verify against raw secret directly (for test mocks and direct signers)
  try {
    const rawKey = textEncoder.encode(secret)
    const { payload } = await jwtVerify(cleanToken, rawKey, { algorithms: ['HS256'] })
    if (payload && (payload.id != null || payload.email != null)) {
      return true
    }
  } catch {
    // Both failed
  }

  return false
}
