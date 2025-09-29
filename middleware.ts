import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  
  // Check for Django JWT token in cookies or headers
  const accessToken = req.cookies.get('access_token')?.value || 
                     req.headers.get('authorization')?.replace('Bearer ', '');
  
  const isAuthenticated = !!accessToken;

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
    if (isAuthRoute && isAuthenticated) {
      return NextResponse.redirect(new URL('/console', req.url));
    }

    // Allow authenticated users to access onboarding
    if (isOnboardingRoute && isAuthenticated) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users from onboarding to signin
    if (isOnboardingRoute && !isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Handle legacy route redirects to console with section parameter
    if (isAuthenticated && legacyRoutes[pathname]) {
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
    if (isAuthenticated && isProjectRoute) {
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

    // Redirect unauthenticated users from protected routes to signin
    if (isProtectedRoute && !isAuthenticated) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

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
