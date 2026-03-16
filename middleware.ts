import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isAppRoute = nextUrl.pathname.startsWith('/(app)') ||
    (nextUrl.pathname !== '/' &&
      nextUrl.pathname !== '/login' &&
      !nextUrl.pathname.startsWith('/api/auth') &&
      !nextUrl.pathname.startsWith('/_next') &&
      !nextUrl.pathname.startsWith('/favicon'))

  const protectedPaths = [
    '/dashboard',
    '/brands',
    '/calendar',
    '/analytics',
    '/library',
  ]

  const isProtected = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (nextUrl.pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
