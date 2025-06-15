import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/projects/create', '/messages'];
  const authRoutes = ['/auth/signin', '/onboarding'];

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Add security headers to all responses
  const secureHeaders = res.headers;
  
  // Content Security Policy
  secureHeaders.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://*.supabase.co https://www.google-analytics.com; img-src 'self' data: https://images.pexels.com https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self'"
  );
  
  // Other security headers
  secureHeaders.set('X-XSS-Protection', '1; mode=block');
  secureHeaders.set('X-Frame-Options', 'DENY');
  secureHeaders.set('X-Content-Type-Options', 'nosniff');
  secureHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  secureHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/signin', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Check if user needs onboarding
  if (session && req.nextUrl.pathname === '/dashboard') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('skills, role')
        .eq('id', session.user.id)
        .single();

      // Redirect to onboarding if profile is incomplete
      if (!profile || !profile.skills || profile.skills.length === 0) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    } catch (error) {
      // If profile doesn't exist, redirect to onboarding
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/health (health check endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/health).*)',
  ],
};