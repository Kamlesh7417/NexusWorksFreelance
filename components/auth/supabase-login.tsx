'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Briefcase } from 'lucide-react';

export function SupabaseLogin() {
  const { signIn, signUp, loading } = useSupabaseAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'client' as 'client' | 'developer',
    bio: '',
    skills: '',
    hourlyRate: '',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      // Validation for sign up
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (!formData.fullName.trim()) {
        setError('Full name is required');
        return;
      }

      const userData = {
        full_name: formData.fullName,
        role: formData.role,
        bio: formData.bio,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        hourly_rate: formData.role === 'developer' && formData.hourlyRate ? 
          parseInt(formData.hourlyRate) : null,
        location: formData.location
      };

      const { data, error } = await signUp(formData.email, formData.password, userData);

      if (error) {
        setError(error.message || 'Failed to create account');
      } else {
        setSuccess('Account created successfully! Please check your email to verify your account.');
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          role: 'client',
          bio: '',
          skills: '',
          hourlyRate: '',
          location: ''
        });
      }
    } else {
      // Sign in
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        setError(error.message || 'Failed to sign in');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">
              {isSignUp ? 'Join NexusWorks' : 'Welcome Back'}
            </h1>
            <p className="text-gray-400">
              {isSignUp ? 'Create your account to get started' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-3 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    >
                      <option value="client" className="bg-gray-900">Client (Hire Developers)</option>
                      <option value="developer" className="bg-gray-900">Developer (Find Work)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="Enter your email"
                  required
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
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="Enter your password"
                  required
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

            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Bio (Optional)
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {formData.role === 'developer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-cyan-400 mb-2">
                        Skills (Optional)
                      </label>
                      <input
                        type="text"
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder="React, Node.js, Python (comma-separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cyan-400 mb-2">
                        Hourly Rate (Optional)
                      </label>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder="50"
                        min="1"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="New York, NY"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  fullName: '',
                  role: 'client',
                  bio: '',
                  skills: '',
                  hourlyRate: '',
                  location: ''
                });
              }}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}