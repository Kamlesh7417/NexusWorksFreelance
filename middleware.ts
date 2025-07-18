import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile', '/projects/create', '/messages'];
    
    // Auth routes that should redirect authenticated users to dashboard
    const authRoutes = ['/auth/signin'];
    
    // Onboarding is separate - authenticated users should be able to access it
    const isOnboardingRoute = pathname.startsWith('/onboarding');

    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );
    
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    );

    // Redirect authenticated users from signin route
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Allow authenticated users to access onboarding
    if (isOnboardingRoute && token) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users from onboarding to signin
    if (isOnboardingRoute && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Check if user needs onboarding (only when accessing dashboard)
    if (token && pathname === '/dashboard') {
      // Check if profile is complete
      if (!token.profileCompleted) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Protected routes require authentication
        const protectedRoutes = ['/dashboard', '/profile', '/projects/create', '/messages'];
        const isProtectedRoute = protectedRoutes.some(route => 
          pathname.startsWith(route)
        );

        // Allow access to protected routes only if authenticated
        if (isProtectedRoute) {
          return !!token;
        }

        // Allow access to all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled by NextAuth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
