import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SignJWT } from 'jose'
import {
  timingSafeCompare,
  extractBearerToken,
  parseCookie,
  verifyAdminSession,
} from './lib/auth-helpers.js'
import { middleware, PUBLIC_API_PREFIXES } from './middleware.js'

const TEST_SECRET = 'test_secret_key_minimum_32_characters_long_12345'
const WRONG_SECRET = 'wrong_secret_key_minimum_32_characters_long_54321'

// Helper to construct mock NextRequest objects
function createMockRequest({ pathname = '/', headers = {}, cookies = {}, method = 'GET' }) {
  const headersMap = new Map(Object.entries(headers))
  const cookiesMap = new Map(Object.entries(cookies))

  return {
    method,
    nextUrl: { pathname },
    headers: {
      get: (key) => headersMap.get(key) || null,
    },
    cookies: {
      get: (key) => (cookiesMap.has(key) ? { value: cookiesMap.get(key) } : undefined),
    },
  }
}

describe('Auth Helpers Unit Tests', () => {
  describe('timingSafeCompare', () => {
    it('returns true for matching strings', async () => {
      expect(await timingSafeCompare('my-secret-123', 'my-secret-123')).toBe(true)
    })

    it('returns false for non-matching strings', async () => {
      expect(await timingSafeCompare('my-secret-123', 'wrong-secret-456')).toBe(false)
    })

    it('returns false for different lengths without error', async () => {
      expect(await timingSafeCompare('short', 'much-longer-string')).toBe(false)
    })

    it('returns false for null, undefined, or empty values', async () => {
      expect(await timingSafeCompare(null, 'secret')).toBe(false)
      expect(await timingSafeCompare('secret', undefined)).toBe(false)
      expect(await timingSafeCompare('', 'secret')).toBe(false)
      expect(await timingSafeCompare('', '')).toBe(false)
    })
  })

  describe('extractBearerToken', () => {
    it('extracts standard Bearer token', () => {
      expect(extractBearerToken('Bearer token123')).toBe('token123')
    })

    it('is case-insensitive and trims whitespace', () => {
      expect(extractBearerToken('  bearer   token_abc_xyz  ')).toBe('token_abc_xyz')
      expect(extractBearerToken('BEARER token_upper')).toBe('token_upper')
    })

    it('returns null for other authorization schemes', () => {
      expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBe(null)
      expect(extractBearerToken('Digest username="user"')).toBe(null)
      expect(extractBearerToken('')).toBe(null)
      expect(extractBearerToken(null)).toBe(null)
    })
  })

  describe('parseCookie', () => {
    it('parses cookie value from cookie header', () => {
      const header = 'foo=bar; payload-token=token_value_123; session=active'
      expect(parseCookie(header, 'payload-token')).toBe('token_value_123')
      expect(parseCookie(header, 'foo')).toBe('bar')
      expect(parseCookie(header, 'session')).toBe('active')
    })

    it('returns null when cookie is missing', () => {
      expect(parseCookie('foo=bar', 'payload-token')).toBe(null)
      expect(parseCookie('', 'payload-token')).toBe(null)
      expect(parseCookie(null, 'payload-token')).toBe(null)
    })
  })

  describe('verifyAdminSession', () => {
    it('validates a genuine token signed with the matching secret', async () => {
      const secretKey = new TextEncoder().encode(TEST_SECRET)
      const validToken = await new SignJWT({ id: 1, email: 'admin@example.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretKey)

      const isValid = await verifyAdminSession(validToken, TEST_SECRET)
      expect(isValid).toBe(true)
    })

    it('rejects forged tokens with arbitrary values', async () => {
      const isForgedValid = await verifyAdminSession('forged_fake_cookie_value', TEST_SECRET)
      expect(isForgedValid).toBe(false)
    })

    it('rejects tokens signed with a different secret', async () => {
      const wrongSecretKey = new TextEncoder().encode(WRONG_SECRET)
      const tokenWithWrongSecret = await new SignJWT({ id: 1 })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(wrongSecretKey)

      const isValid = await verifyAdminSession(tokenWithWrongSecret, TEST_SECRET)
      expect(isValid).toBe(false)
    })

    it('returns false for null or empty values', async () => {
      expect(await verifyAdminSession(null, TEST_SECRET)).toBe(false)
      expect(await verifyAdminSession('', TEST_SECRET)).toBe(false)
      expect(await verifyAdminSession('some-token', null)).toBe(false)
    })
  })
})

describe('FULL_RESTRICTION Middleware Integration Tests', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.PAYLOAD_SECRET = TEST_SECRET
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('allows all requests when FULL_RESTRICTION is not true', async () => {
    process.env.FULL_RESTRICTION = 'false'
    const req = createMockRequest({ pathname: '/api/globals/profile' })
    const res = await middleware(req)
    // NextResponse.next() returns a response without 401 status
    expect(res.status).not.toBe(401)
  })

  describe('When FULL_RESTRICTION is true', () => {
    beforeEach(() => {
      process.env.FULL_RESTRICTION = 'true'
    })

    it('allows CORS OPTIONS preflight requests', async () => {
      const req = createMockRequest({ pathname: '/api/globals/profile', method: 'OPTIONS' })
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it('allows all public auth and health endpoints', async () => {
      for (const prefix of PUBLIC_API_PREFIXES) {
        const req = createMockRequest({ pathname: `${prefix}/test` })
        const res = await middleware(req)
        expect(res.status).not.toBe(401)
      }
    })

    it('denies access to protected API routes without credentials (401)', async () => {
      const req = createMockRequest({ pathname: '/api/globals/profile' })
      const res = await middleware(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.errors[0].message).toContain('Unauthorized: Access restricted by FULL_RESTRICTION')
    })

    it('denies access to media proxy routes without credentials (401)', async () => {
      const req = createMockRequest({ pathname: '/my-portfolio/media/test.webp' })
      const res = await middleware(req)
      expect(res.status).toBe(401)
      const text = await res.text()
      expect(text).toContain('Unauthorized: Access restricted by FULL_RESTRICTION')
    })

    it('allows access with valid x-payload-secret header', async () => {
      const req = createMockRequest({
        pathname: '/api/globals/profile',
        headers: { 'x-payload-secret': TEST_SECRET },
      })
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it('allows access with valid Authorization: Bearer <secret>', async () => {
      const req = createMockRequest({
        pathname: '/api/globals/profile',
        headers: { authorization: `Bearer ${TEST_SECRET}` },
      })
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it('denies access with invalid secret header', async () => {
      const req = createMockRequest({
        pathname: '/api/globals/profile',
        headers: { 'x-payload-secret': 'invalid_secret' },
      })
      const res = await middleware(req)
      expect(res.status).toBe(401)
    })

    it('denies access with forged payload-token cookie', async () => {
      const req = createMockRequest({
        pathname: '/api/globals/profile',
        cookies: { 'payload-token': 'attacker_forged_cookie_value' },
      })
      const res = await middleware(req)
      expect(res.status).toBe(401)
    })

    it('allows access with genuine cryptographically signed payload-token cookie', async () => {
      const secretKey = new TextEncoder().encode(TEST_SECRET)
      const genuineToken = await new SignJWT({ id: 1, email: 'admin@showayeb.dev' })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretKey)

      const req = createMockRequest({
        pathname: '/api/globals/profile',
        cookies: { 'payload-token': genuineToken },
      })
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it('allows access to /my-portfolio/* with genuine payload-token cookie', async () => {
      const secretKey = new TextEncoder().encode(TEST_SECRET)
      const genuineToken = await new SignJWT({ id: 1 })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretKey)

      const req = createMockRequest({
        pathname: '/my-portfolio/projects/demo.webp',
        cookies: { 'payload-token': genuineToken },
      })
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })
  })
})
