'use client';

import { useState } from 'react';
import { X, User, Lock, Eye, EyeOff } from 'lucide-react';
import { GithubSignInButton } from './github-signin-button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white/5 border border-white/20 rounded-2xl p-8 max-w-md w-[90%] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">Access NexusWorks</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <GithubSignInButton />
          
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 flex-grow"></div>
            <span className="mx-4 text-sm text-gray-400">or continue with email</span>
            <div className="border-t border-white/10 flex-grow"></div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-3 py-2 text-white outline-none focus:border-cyan-400"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-10 py-2 text-white outline-none focus:border-cyan-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              className="nexus-action-btn w-full flex items-center justify-center gap-2"
            >
              Access Platform
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <a href="/auth/signin" className="text-cyan-400 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}