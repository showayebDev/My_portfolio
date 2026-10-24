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
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Cryptographically verifies if the payload-token JWT was genuinely signed with PAYLOAD_SECRET.
 * Rejects forged, expired, or tampered cookies.
 * @param {string | null | undefined} token
 * @param {string | null | undefined} secret
 * @returns {Promise<boolean>}
 */
export async function verifyAdminSession(token, secret) {
  if (!token || !secret) return false
  try {
    const secretKey = textEncoder.encode(secret)
    const { payload } = await jwtVerify(token, secretKey)
    return Boolean(payload && payload.id)
  } catch {
    return false
  }
}
