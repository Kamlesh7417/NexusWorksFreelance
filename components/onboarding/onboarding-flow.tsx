'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  Code, 
  Zap, 
  Rocket, 
  Target
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

export function OnboardingFlow() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    role: '',
    skills: '',
    hourly_rate: '',
    bio: '',
    experience_level: 'beginner',
    location: '',
    availability_status: 'available'
  });
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

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

  const steps: OnboardingStep[] = [
    {
      id: 'role',
      title: 'Choose Your Role',
      description: 'Select the role that best describes how you'll use NexusWorks'
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Tell us about yourself and your professional background'
    },
    {
      id: 'skills',
      title: 'Add Your Skills',
      description: 'Let us know your expertise to match you with the right opportunities'
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Configure your account settings and notification preferences'
    }
  ];

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
    setCompletedSteps([...completedSteps, 'role']);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    const currentStepId = steps[currentStep].id;
    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps([...completedSteps, currentStepId]);
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
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
          hourly_rate: formData.role === 'developer' || formData.role === 'freelancer' ? parseInt(formData.hourly_rate) || null : null,
          bio: formData.bio,
          experience_level: formData.experience_level,
          location: formData.location,
          availability_status: formData.availability_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        throw new Error('Failed to update profile');
      }

      // Redirect to dashboard
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
      <div className="max-w-3xl w-full bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-500/20 text-green-400'
                      : currentStep === index
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`flex-1 h-1 mx-2 ${
                      completedSteps.includes(step.id) ? 'bg-green-400/40' : 'bg-white/10'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            {steps.map((step, index) => (
              <div 
                key={`label-${step.id}`}
                className={`w-16 text-center ${
                  completedSteps.includes(step.id)
                    ? 'text-green-400'
                    : currentStep === index
                      ? 'text-cyan-400'
                      : 'text-gray-400'
                }`}
                style={{ marginLeft: index === 0 ? '0' : index === steps.length - 1 ? '-16px' : '-8px' }}
              >
                {step.id}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {steps[currentStep].title}
          </h1>
          <p className="text-gray-400">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Step 1: Role Selection */}
        {currentStep === 0 && (
          <div className="space-y-6">
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
                <Code size={48} className="mx-auto mb-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Developer</h3>
                <p className="text-sm text-gray-400">I'm a freelancer looking for projects</p>
              </button>

              <button
                onClick={() => handleRoleSelect('student')}
                className="p-6 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-200 text-center group"
              >
                <GraduationCap size={48} className="mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Student</h3>
                <p className="text-sm text-gray-400">I want to learn and earn while building skills</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Profile Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                placeholder="City, Country"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrevStep}
                className="border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Skills */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {(formData.role === 'developer' || formData.role === 'student') && (
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
                      <option value="beginner" className="bg-gray-900">Beginner (0-2 years)</option>
                      <option value="intermediate" className="bg-gray-900">Intermediate (2-5 years)</option>
                      <option value="advanced" className="bg-gray-900">Advanced (5+ years)</option>
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

            {formData.role === 'client' && (
              <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase size={24} className="text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Client Profile</h3>
                </div>
                <p className="text-gray-400 mb-4">
                  As a client, you'll be able to post projects, hire developers, and manage your projects through our platform.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
                    <Zap size={20} className="text-cyan-400" />
                    <div className="text-sm">
                      <div className="font-medium text-white">AI Matching</div>
                      <div className="text-gray-400">Find perfect developers</div>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
                    <Rocket size={20} className="text-purple-400" />
                    <div className="text-sm">
                      <div className="font-medium text-white">Fast Delivery</div>
                      <div className="text-gray-400">Efficient project completion</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handlePrevStep}
                className="border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Preferences */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Availability Status
              </label>
              <select
                value={formData.availability_status}
                onChange={(e) => setFormData(prev => ({ ...prev, availability_status: e.target.value }))}
                className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                <option value="available" className="bg-gray-900">Available for Work</option>
                <option value="busy" className="bg-gray-900">Limited Availability</option>
                <option value="unavailable" className="bg-gray-900">Not Available</option>
              </select>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target size={24} className="text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Almost There!</h3>
              </div>
              <p className="text-gray-300 mb-4">
                You're just one step away from accessing the NexusWorks platform. Click "Complete Setup" to finalize your profile and start exploring.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle size={16} className="text-green-400" />
                <span>Your data is secure and private</span>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrevStep}
                className="border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing Setup...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}