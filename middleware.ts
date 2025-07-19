import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname, searchParams } = req.nextUrl;
    const token = req.nextauth?.token;

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/console', '/profile', '/projects/create', '/messages'];
    
    // Auth routes that should redirect authenticated users to console
    const authRoutes = ['/auth/signin'];
    
    // Legacy routes that should redirect to console with section parameter
    const legacyRoutes = {
      '/profile': 'profile',
      '/messages': 'messages', 
      '/projects': 'projects',
      '/payments': 'payments'
    };
    
    // Check for project-specific routes that should redirect to console
    const projectRouteMatch = pathname.match(/^\/projects\/([^\/]+)(?:\/(.+))?$/);
    const isProjectRoute = projectRouteMatch && !pathname.startsWith('/projects/create');
    
    // Onboarding is separate - authenticated users should be able to access it
    const isOnboardingRoute = pathname.startsWith('/onboarding');

    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );
    
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    );

    // Redirect authenticated users from signin route to console
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL('/console', req.url));
    }

    // Allow authenticated users to access onboarding
    if (isOnboardingRoute && token) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users from onboarding to signin
    if (isOnboardingRoute && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Handle legacy route redirects to console with section parameter
    if (token && legacyRoutes[pathname]) {
      const section = legacyRoutes[pathname];
      const url = new URL('/console', req.url);
      url.searchParams.set('section', section);
      
      // Preserve any existing query parameters
      searchParams.forEach((value, key) => {
        if (key !== 'section') {
          url.searchParams.set(key, value);
        }
      });
      
      return NextResponse.redirect(url);
    }
    
    // Handle project-specific routes redirect to console
    if (token && isProjectRoute) {
      const [, projectId, subPath] = projectRouteMatch!;
      const url = new URL('/console', req.url);
      url.searchParams.set('section', 'projects');
      url.searchParams.set('project', projectId);
      
      if (subPath) {
        url.searchParams.set('view', subPath);
      }
      
      // Preserve any existing query parameters
      searchParams.forEach((value, key) => {
        if (!['section', 'project', 'view'].includes(key)) {
          url.searchParams.set(key, value);
        }
      });
      
      return NextResponse.redirect(url);
    }

    // Check if user needs onboarding (when accessing dashboard or console)
    if (token && (pathname === '/dashboard' || pathname === '/console')) {
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
