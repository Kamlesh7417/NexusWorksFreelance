'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
      case 'OAuthAccountNotLinked':
        return 'There was a problem with the OAuth authentication. Please try again.';
      case 'EmailSignin':
        return 'The email sign in link is invalid or has expired.';
      case 'CredentialsSignin':
        return 'The credentials you provided were invalid.';
      case 'SessionRequired':
        return 'You must be signed in to access this page.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle size={32} className="text-red-400" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-400 mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-400">
              {getErrorMessage(error)}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/auth/signin"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-center"
            >
              Try Again
            </Link>
            
            <Link
              href="/"
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-center"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}