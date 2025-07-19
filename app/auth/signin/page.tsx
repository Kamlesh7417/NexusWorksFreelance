'use client';

import { useSearchParams } from 'next/navigation';
import { AuthForms } from '@/components/auth/auth-forms';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/console';

  return (
    <AuthProvider>
      <div className="min-h-screen bg-black flex items-center justify-center p-4 animate-fadeIn">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
              <span className="text-white font-bold text-3xl">N</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Welcome to NexusWorks
            </h1>
            <p className="text-gray-300 text-lg">Sign in to access the future of freelancing</p>
          </div>

          <AuthForms redirectTo={redirectTo} />
          
          <div className="text-center mt-8">
            <Link 
              href="/"
              className="nexus-back-btn inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}