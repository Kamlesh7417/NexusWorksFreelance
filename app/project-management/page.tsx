'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectManagementRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-cyan-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}