import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware for server-side admin authentication
 *
 * This middleware protects /admin routes by validating JWT tokens on the server.
 * It prevents unauthorized access and blocks bundle downloads for non-admin users.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only apply middleware to /admin routes
  if (pathname.startsWith('/admin')) {
    try {
      // Try to get JWT token from cookie first (for SSR compatibility)
      let token = request.cookies.get('token')?.value

      // If not in cookie, try to extract from localStorage-based cookie
      // (Next.js app will need to sync localStorage token to cookie)
      if (!token) {
        // Redirect to login if no token found
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Validate admin status with backend
      // Note: We need to use absolute URL for fetch in middleware
      const validateUrl = `${API_BASE_URL}/api/auth/validate-admin`

      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Don't cache admin validation
      })

      // If unauthorized (401) or forbidden (403), redirect to login
      if (response.status === 401 || response.status === 403) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        loginUrl.searchParams.set('error', response.status === 403 ? 'forbidden' : 'unauthorized')
        return NextResponse.redirect(loginUrl)
      }

      // If validation fails for other reasons, redirect to login
      if (!response.ok) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        loginUrl.searchParams.set('error', 'validation_failed')
        return NextResponse.redirect(loginUrl)
      }

      const data = await response.json()

      // Double-check isAdmin flag
      if (!data.isAdmin) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        loginUrl.searchParams.set('error', 'forbidden')
        return NextResponse.redirect(loginUrl)
      }

      // Admin validation successful - allow request
      return NextResponse.next()

    } catch (error) {
      console.error('Middleware admin validation error:', error)

      // On error, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('error', 'server_error')
      return NextResponse.redirect(loginUrl)
    }
  }

  // For non-admin routes, allow request to proceed
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Match all /admin routes
    '/admin/:path*',

    // Exclude static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
