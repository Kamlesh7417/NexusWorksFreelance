'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Briefcase, GraduationCap, Loader2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '',
    skills: '',
    hourly_rate: '',
    bio: '',
    experience_level: 'junior'
  });

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      setUser(user);
    };

    getUser();
  }, [router, supabase.auth]);

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          role: formData.role,
          skills: skillsArray,
          hourly_rate: formData.role === 'developer' ? parseInt(formData.hourly_rate) || null : null,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        alert('Failed to update profile. Please try again.');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to NexusWorks!</h1>
          <p className="text-gray-400">Let's set up your profile to get started</p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              What best describes you?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleRoleSelect('client')}
                className="p-6 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-200 text-center group"
              >
                <Briefcase size={48} className="mx-auto mb-4 text-green-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Client</h3>
                <p className="text-sm text-gray-400">I want to hire developers for my projects</p>
              </button>

              <button
                onClick={() => handleRoleSelect('developer')}
                className="p-6 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-200 text-center group"
              >
                <User size={48} className="mx-auto mb-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Developer</h3>
                <p className="text-sm text-gray-400">I'm a freelancer looking for projects</p>
              </button>

              <button
                onClick={() => handleRoleSelect('developer')}
                className="p-6 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-200 text-center group"
              >
                <GraduationCap size={48} className="mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Student</h3>
                <p className="text-sm text-gray-400">I want to learn and earn while building skills</p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Tell us more about yourself
            </h2>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 min-h-[100px]"
                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
              />
            </div>

            {formData.role === 'developer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="React, Node.js, Python, TypeScript..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={formData.experience_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                      className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    >
                      <option value="junior" className="bg-gray-900">Junior (0-2 years)</option>
                      <option value="mid" className="bg-gray-900">Mid-level (2-5 years)</option>
                      <option value="senior" className="bg-gray-900">Senior (5+ years)</option>
                      <option value="expert" className="bg-gray-900">Expert (10+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Hourly Rate (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      placeholder="50"
                      min="1"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}