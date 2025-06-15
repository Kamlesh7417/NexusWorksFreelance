'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Unauthorized() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <ShieldAlert size={32} className="text-red-400" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-400 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-400">
              You don't have permission to access this page.
              {session?.user?.role && (
                <span> Your current role is <strong className="text-white">{session.user.role}</strong>.</span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Home size={16} />
              Return to Home
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}