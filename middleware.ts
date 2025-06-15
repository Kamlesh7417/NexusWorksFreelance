import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/projects/create',
  '/messages',
  '/settings',
];

// Routes that require specific roles
const roleProtectedRoutes = {
  '/projects/create': ['client', 'admin'],
  '/client-dashboard': ['client', 'admin'],
  '/developer-dashboard': ['developer', 'freelancer', 'student', 'admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isProtectedRoute) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // If no token, redirect to sign in
    if (!token) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
    
    // Check role-based access
    for (const [route, roles] of Object.entries(roleProtectedRoutes)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        const userRole = token.role as string;
        
        if (!roles.includes(userRole)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/projects/create/:path*',
    '/messages/:path*',
    '/settings/:path*',
    '/client-dashboard/:path*',
    '/developer-dashboard/:path*',
  ],
};