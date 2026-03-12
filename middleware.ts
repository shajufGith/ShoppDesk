import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const { pathname } = req.nextUrl

        // Manager-only routes
        const managerRoutes = ['/employees', '/segments', '/settings']
        const isManagerRoute = managerRoutes.some((r) => pathname.startsWith(r))

        if (isManagerRoute && token?.role !== 'MANAGER') {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
)

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register-business|manifest.json|icons).*)'],
}
