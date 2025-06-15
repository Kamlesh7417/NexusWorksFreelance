'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // If the user is not authenticated, redirect to sign in
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // If we're still loading, wait
    if (status === 'loading') {
      return;
    }

    // If there are allowed roles specified, check if the user has one of them
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = session?.user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.push('/unauthorized');
        return;
      }
    }

    // User is authorized
    setIsAuthorized(true);
  }, [status, session, router, pathname, allowedRoles]);

  if (status === 'loading' || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-400 text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}