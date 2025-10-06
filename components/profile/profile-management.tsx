'use client';

import React, { useState, useCallback } from 'react';
import { DjangoUser } from '@/components/auth/django-auth-provider';
import { DeveloperProfile, apiClient } from '@/lib/api-client';
import { useSmartNotifications } from '@/lib/services/smart-notifications';
import { Save, Loader2, User, MapPin, Clock, DollarSign } from 'lucide-react';

interface ProfileManagementProps {
  user: DjangoUser;
  profile: DeveloperProfile | null;
  onUpdate: () => void;
}

export function ProfileManagement({ user, profile, onUpdate }: ProfileManagementProps) {
  const { showSuccess, showError } = useSmartNotifications();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    bio: user.bio || '',
    location: user.location || '',
    timezone: user.timezone || '',
    hourly_rate: profile?.hourly_rate?.toString() || '',
    availability_hours_per_week: user.availability_hours_per_week?.toString() || '',
    experience_level: profile?.experience_level || 'junior'
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update user profile via Django API
      const userUpdateResponse = await apiClient.makeRequest('/users/profile/', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          location: formData.location,
          timezone: formData.timezone,
          availability_hours_per_week: formData.availability_hours_per_week ? 
            parseInt(formData.availability_hours_per_week) : undefined
        })
      });

      if (userUpdateResponse.error) {
        throw new Error(userUpdateResponse.error);
      }

      // Update developer profile if user is a developer
      if (profile) {
        const profileUpdateData = {
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : 0,
          experience_level: formData.experience_level as 'junior' | 'mid' | 'senior' | 'expert'
        };

        const response = await apiClient.updateDeveloperProfile(profileUpdateData);
        if (response.error) {
          throw new Error(response.error);
        }
      }

      showSuccess('Profile updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Profile update error:', error);
      showError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const isDeveloper = user.role === 'developer' || user.user_type === 'freelancer';

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">General Information</h3>
        <p className="text-gray-400 text-sm mb-6">
          Update your basic profile information and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              <User size={16} className="inline mr-2" />
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="John"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              <User size={16} className="inline mr-2" />
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 min-h-[120px]"
            placeholder="Tell us about yourself, your experience, and what makes you unique..."
            maxLength={500}
          />
          <div className="text-xs text-gray-400 mt-1">
            {formData.bio.length}/500 characters
          </div>
        </div>

        {/* Location and Timezone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="New York, NY, USA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              <Clock size={16} className="inline mr-2" />
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              <option value="" className="bg-gray-900">Select timezone</option>
              <option value="America/New_York" className="bg-gray-900">Eastern Time (ET)</option>
              <option value="America/Chicago" className="bg-gray-900">Central Time (CT)</option>
              <option value="America/Denver" className="bg-gray-900">Mountain Time (MT)</option>
              <option value="America/Los_Angeles" className="bg-gray-900">Pacific Time (PT)</option>
              <option value="Europe/London" className="bg-gray-900">London (GMT)</option>
              <option value="Europe/Paris" className="bg-gray-900">Paris (CET)</option>
              <option value="Asia/Tokyo" className="bg-gray-900">Tokyo (JST)</option>
              <option value="Asia/Shanghai" className="bg-gray-900">Shanghai (CST)</option>
              <option value="Australia/Sydney" className="bg-gray-900">Sydney (AEST)</option>
            </select>
          </div>
        </div>

        {/* Developer-specific fields */}
        {isDeveloper && (
          <>
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-lg font-semibold text-white mb-4">Developer Information</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  <DollarSign size={16} className="inline mr-2" />
                  Hourly Rate (USD)
                </label>
                <input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="50"
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="junior" className="bg-gray-900">Junior (0-2 years)</option>
                  <option value="mid" className="bg-gray-900">Mid-level (2-5 years)</option>
                  <option value="senior" className="bg-gray-900">Senior (5+ years)</option>
                  <option value="expert" className="bg-gray-900">Expert (10+ years)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Hours/Week Available
                </label>
                <input
                  type="number"
                  value={formData.availability_hours_per_week}
                  onChange={(e) => handleInputChange('availability_hours_per_week', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="40"
                  min="1"
                  max="80"
                />
              </div>
            </div>
          </>
        )}

        {/* Availability Hours for all users */}
        {!isDeveloper && (
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              <Clock size={16} className="inline mr-2" />
              Hours/Week Available for Projects
            </label>
            <input
              type="number"
              value={formData.availability_hours_per_week}
              onChange={(e) => handleInputChange('availability_hours_per_week', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="20"
              min="1"
              max="80"
            />
            <div className="text-xs text-gray-400 mt-1">
              How many hours per week can you dedicate to managing projects?
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-white/10">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}