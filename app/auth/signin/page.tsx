'use client';

import { useSearchParams } from 'next/navigation';
import { AuthForms } from '@/components/auth/auth-forms';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to NexusWorks</h1>
          <p className="text-gray-400">Sign in to access the future of freelancing</p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <AuthForms redirectTo={redirectTo} />
        </div>
        
        <div className="text-center mt-6">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}