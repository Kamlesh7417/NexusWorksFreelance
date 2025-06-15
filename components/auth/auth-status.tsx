'use client';

import { useSession } from 'next-auth/react';
import { LoginButton } from './login-button';
import { UserMenu } from './user-menu';

export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse"></div>
    );
  }

  return session ? <UserMenu user={session.user} /> : <LoginButton />;
}