/**
 * Token Manager for JWT authentication
 *
 * Manages JWT tokens in both localStorage (for client-side) and cookies (for middleware).
 * This enables server-side admin validation in Next.js middleware.
 */

const TOKEN_KEY = 'token'

/**
 * Set JWT token in both localStorage and cookie
 */
export function setAuthToken(token: string): void {
  // Store in localStorage for client-side access
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)

    // Also set as cookie for middleware access
    // Using max-age of 24 hours (86400 seconds) to match JWT expiry
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; samesite=lax`
  }
}

/**
 * Get JWT token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

/**
 * Remove JWT token from both localStorage and cookie
 */
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    // Remove from localStorage
    localStorage.removeItem(TOKEN_KEY)

    // Remove cookie by setting expiry to past
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

/**
 * Check if user is authenticated (has token)
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}
