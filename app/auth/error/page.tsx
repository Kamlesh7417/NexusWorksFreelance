'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'An unknown error occurred';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
        
        <p className="text-gray-300 mb-6">
          {error}
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          
          <Link 
            href="/auth/signin"
            className="w-full border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}