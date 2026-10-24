import { NextResponse } from 'next/server'
import {
  timingSafeCompare,
  extractBearerToken,
  verifyAdminSession,
} from './lib/auth-helpers.js'

// Public endpoints under /api that must remain accessible for authentication and health checks
export const PUBLIC_API_PREFIXES = [
  '/api/users/login',
  '/api/users/logout',
  '/api/users/refresh-token',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/health',
]

export { timingSafeCompare, extractBearerToken, verifyAdminSession }

/**
 * Next.js Edge Middleware for FULL_RESTRICTION mode.
 * Protects Payload CMS API endpoints (/api/*) and media proxy routes (/my-portfolio/*).
 */
export async function middleware(request) {
  // If restriction is not enabled, allow all traffic through
  if (process.env.FULL_RESTRICTION !== 'true') {
    return NextResponse.next()
  }

  // Allow CORS preflight requests
  if (request.method === 'OPTIONS') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // 1. Allow public auth & health check endpoints
  if (
    PUBLIC_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return NextResponse.next()
  }

  const payloadSecret = process.env.PAYLOAD_SECRET

  // 2. Timing-safe verification of secret header (x-payload-secret or Bearer)
  if (payloadSecret) {
    const headerSecret = request.headers.get('x-payload-secret')
    if (headerSecret && (await timingSafeCompare(headerSecret, payloadSecret))) {
      return NextResponse.next()
    }

    const bearerToken = extractBearerToken(request.headers.get('authorization'))
    if (bearerToken && (await timingSafeCompare(bearerToken, payloadSecret))) {
      return NextResponse.next()
    }
  }

  // 3. Cryptographically verify genuine admin session cookie (payload-token)
  const tokenCookie = request.cookies.get('payload-token')
  if (tokenCookie && tokenCookie.value && payloadSecret) {
    const isValid = await verifyAdminSession(tokenCookie.value, payloadSecret)
    if (isValid) {
      return NextResponse.next()
    }
  }

  // 4. Deny unauthorized requests
  if (pathname.startsWith('/my-portfolio/')) {
    return new NextResponse('Unauthorized: Access restricted by FULL_RESTRICTION', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json(
    {
      errors: [
        {
          message:
            'Unauthorized: Access restricted by FULL_RESTRICTION mode. Provide a valid x-payload-secret header or log in to the admin panel.',
        },
      ],
    },
    { status: 401 }
  )
}

export const config = {
  matcher: ['/api/:path*', '/my-portfolio/:path*'],
}
