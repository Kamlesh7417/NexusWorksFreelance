'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, User, Edit, Save, X, Plus, Trash2, MapPin, Clock, DollarSign, Star } from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function Profile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    role: '',
    skills: [] as string[],
    hourly_rate: 0,
    location: '',
    experience_level: '',
    availability_status: '',
    newSkill: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.profile) {
      const profile = session.user.profile;
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        role: profile.role || 'developer',
        skills: profile.skills || [],
        hourly_rate: profile.hourly_rate || 0,
        location: profile.location || '',
        experience_level: profile.experience_level || 'beginner',
        availability_status: profile.availability_status || 'available',
        newSkill: ''
      });
    }
  }, [session]);

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
      // Update profile in Supabase
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          bio: formData.bio,
          role: formData.role,
          skills: formData.skills,
          hourly_rate: formData.hourly_rate,
          location: formData.location,
          experience_level: formData.experience_level,
          availability_status: formData.availability_status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update session
      await update();
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-400 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Header */}
        <header className="bg-black/80 border-b border-white/10 backdrop-blur-lg p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <h1 className="text-xl font-bold text-white">NexusWorks</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <a href="/dashboard" className="text-white hover:text-cyan-400 transition-colors">Dashboard</a>
                <a href="/projects" className="text-white hover:text-cyan-400 transition-colors">Projects</a>
                <a href="/messages" className="text-white hover:text-cyan-400 transition-colors">Messages</a>
                <a href="/community" className="text-white hover:text-cyan-400 transition-colors">Community</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto p-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">Your Profile</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 py-2 px-4 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 py-2 px-4 rounded-lg transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="developer" className="bg-gray-900">Developer</option>
                      <option value="client" className="bg-gray-900">Client</option>
                      <option value="freelancer" className="bg-gray-900">Freelancer</option>
                      <option value="student" className="bg-gray-900">Student</option>
                    </select>
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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Experience Level
                    </label>
                    <select
                      name="experience_level"
                      value={formData.experience_level}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="beginner" className="bg-gray-900">Beginner</option>
                      <option value="intermediate" className="bg-gray-900">Intermediate</option>
                      <option value="advanced" className="bg-gray-900">Advanced</option>
                      <option value="expert" className="bg-gray-900">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Hourly Rate (USD)
                    </label>
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                      Availability
                    </label>
                    <select
                      name="availability_status"
                      value={formData.availability_status}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="available" className="bg-gray-900">Available</option>
                      <option value="busy" className="bg-gray-900">Busy</option>
                      <option value="unavailable" className="bg-gray-900">Unavailable</option>
                    </select>
                  </div>
                </div>

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

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  {session?.user?.image ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden">
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <User size={32} className="text-cyan-400" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white">{session?.user?.name}</h3>
                    <p className="text-gray-400">{session?.user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm text-cyan-400 capitalize">
                        {session?.user?.profile?.role || 'Developer'}
                      </span>
                      {session?.user?.profile?.github_username && (
                        <a 
                          href={`https://github.com/${session.user.profile.github_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-sm text-purple-400 flex items-center gap-1"
                        >
                          <Github size={12} />
                          {session.user.profile.github_username}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-cyan-400" />
                      <h4 className="font-medium text-white">Location</h4>
                    </div>
                    <p className="text-gray-400">
                      {session?.user?.profile?.location || 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-cyan-400" />
                      <h4 className="font-medium text-white">Experience</h4>
                    </div>
                    <p className="text-gray-400 capitalize">
                      {session?.user?.profile?.experience_level || 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-cyan-400" />
                      <h4 className="font-medium text-white">Hourly Rate</h4>
                    </div>
                    <p className="text-gray-400">
                      {session?.user?.profile?.hourly_rate ? `$${session.user.profile.hourly_rate}/hr` : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="font-medium text-white mb-2">Bio</h4>
                  <p className="text-gray-400">
                    {session?.user?.profile?.bio || 'No bio provided yet.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {session?.user?.profile?.skills && session.user.profile.skills.length > 0 ? (
                      session.user.profile.skills.map((skill: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm text-white">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400">No skills added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}