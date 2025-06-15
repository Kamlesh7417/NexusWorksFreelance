'use client';

import { signIn } from 'next-auth/react';
import { Github, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface GithubSignInButtonProps {
  callbackUrl?: string;
  className?: string;
}

export function GithubSignInButton({ callbackUrl = '/dashboard', className = '' }: GithubSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('github', { callbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Github className="h-5 w-5" />
      )}
      Sign in with GitHub
    </button>
  );
}