'use client';

import { useState } from 'react';
import { AuthService, DEMO_USERS } from '@/lib/auth';
import { X, User, Lock, Eye, EyeOff, Mail } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await AuthService.login(email, password);
      if (user) {
        onLogin(user);
        onClose();
        setEmail('');
        setPassword('');
      } else {
        setError('Invalid credentials. Use demo credentials provided below.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo123');
  };

  if (!isOpen) return null;

  const clientUsers = DEMO_USERS.filter(u => u.role === 'client');
  const developerUsers = DEMO_USERS.filter(u => u.role === 'developer');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Welcome to NexusWorks</h2>
              <p className="text-muted-foreground">Sign in to access your dashboard</p>
            </div>
            <button onClick={onClose} className="btn-ghost p-2">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Login Form */}
            <div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10 pr-10"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 card p-4">
                <h4 className="font-medium text-foreground mb-2">Demo Credentials</h4>
                <p className="text-sm text-muted-foreground">
                  Use any email from the demo accounts with password: <code className="bg-muted px-2 py-1 rounded text-foreground">demo123</code>
                </p>
              </div>
            </div>

            {/* Demo Accounts */}
            <div className="space-y-6">
              {/* Client Accounts */}
              <div>
                <h3 className="text-lg font-semibold text-green-500 mb-4">Client Accounts</h3>
                <div className="space-y-3">
                  {clientUsers.map(user => (
                    <div key={user.id} className="card p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <User size={16} className="text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium text-green-500">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {(user.profile as any).company} • {(user.profile as any).industry}
                      </div>
                      <button
                        onClick={() => quickLogin(user.email)}
                        className="btn-outline w-full text-sm"
                      >
                        Quick Login
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Developer Accounts */}
              <div>
                <h3 className="text-lg font-semibold text-purple-500 mb-4">Developer Accounts</h3>
                <div className="space-y-3">
                  {developerUsers.map(user => (
                    <div key={user.id} className="card p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <User size={16} className="text-purple-500" />
                        </div>
                        <div>
                          <div className="font-medium text-purple-500">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {(user.profile as any).specializations[0]} • ${(user.profile as any).hourlyRate}/hr
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-yellow-500">★ {(user.profile as any).rating}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{(user.profile as any).completedProjects} projects</span>
                      </div>
                      <button
                        onClick={() => quickLogin(user.email)}
                        className="btn-outline w-full text-sm"
                      >
                        Quick Login
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}