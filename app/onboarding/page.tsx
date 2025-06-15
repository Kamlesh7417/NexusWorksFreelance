'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, User, Briefcase, Code, Building, Plus, X } from 'lucide-react';

export default function Onboarding() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: 'developer',
    bio: '',
    skills: [] as string[],
    hourlyRate: 0,
    newSkill: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/onboarding');
    } else if (status === 'authenticated' && session?.user?.profile?.onboarded) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ''
      }));
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: formData.role,
          bio: formData.bio,
          skills: formData.skills,
          hourlyRate: formData.hourlyRate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Update session
      await update();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error during onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-400">
              Welcome to NexusWorks, {session.user.name}! Let's set up your profile.
            </p>
          </div>

          <div className="flex justify-between mb-8">
            {[1, 2].map((s) => (
              <div 
                key={s} 
                className={`w-1/2 h-2 rounded-full mx-1 ${
                  s <= step ? 'bg-cyan-400' : 'bg-white/20'
                }`}
              ></div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'developer' }))}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        formData.role === 'developer'
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-white'
                          : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Code size={20} className={formData.role === 'developer' ? 'text-cyan-400' : 'text-gray-400'} />
                        <span className="font-medium">Developer</span>
                      </div>
                      <p className="text-sm opacity-80">I want to find work and build projects</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'client' }))}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        formData.role === 'client'
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-white'
                          : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Building size={20} className={formData.role === 'client' ? 'text-cyan-400' : 'text-gray-400'} />
                        <span className="font-medium">Client</span>
                      </div>
                      <p className="text-sm opacity-80">I want to hire developers for my projects</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {formData.role === 'developer' && (
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Hourly Rate (USD)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                      placeholder="50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full px-3 py-1">
                        <span className="text-sm text-white">{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="newSkill"
                      value={formData.newSkill}
                      onChange={handleInputChange}
                      placeholder="Add a skill..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                  >
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}