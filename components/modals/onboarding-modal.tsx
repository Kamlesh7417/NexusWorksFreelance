'use client';

import { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'web',
    skills: '',
    experience: 'beginner'
  });

  const handleSubmit = () => {
    // Here you would typically save to Supabase
    console.log('Onboarding data:', formData);
    alert('Profile setup complete! Welcome to NexusWorks!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white/5 border border-white/20 rounded-2xl p-8 max-w-2xl w-[90%] max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Quick Start: Join NexusWorks</h2>
        <p className="mb-6">Let's tailor your experience. Select your role and skills to get started instantly.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-cyan-400 text-sm mb-2">Your Name</label>
            <input 
              type="text" 
              className="bg-white/10 border border-cyan-500/30 rounded-md px-3 py-2 text-white outline-none"
              placeholder="e.g., John Doe"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-cyan-400 text-sm mb-2">Primary Role</label>
            <select 
              className="bg-white/10 border border-cyan-500/30 rounded-md px-3 py-2 text-white outline-none"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="web">Website Builder</option>
              <option value="design">Logo/Graphic Designer</option>
              <option value="social">Social Media Engineer</option>
              <option value="software">Software Developer</option>
              <option value="hardware">Hardware Designer/Engineer</option>
              <option value="student">Professional Student</option>
              <option value="quantum">Quantum Computing Specialist</option>
              <option value="ai">AI/ML Engineer</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="flex flex-col md:col-span-2">
            <label className="text-cyan-400 text-sm mb-2">Key Skills (comma-separated)</label>
            <textarea 
              className="bg-white/10 border border-cyan-500/30 rounded-md px-3 py-2 text-white outline-none min-h-[80px] resize-vertical"
              placeholder="e.g., JavaScript, UI Design, Quantum Algorithms, Social Media Marketing"
              value={formData.skills}
              onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
            />
          </div>
          
          <div className="flex flex-col md:col-span-2">
            <label className="text-cyan-400 text-sm mb-2">Experience Level</label>
            <select 
              className="bg-white/10 border border-cyan-500/30 rounded-md px-3 py-2 text-white outline-none"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
            >
              <option value="beginner">Beginner (0-2 years)</option>
              <option value="intermediate">Intermediate (2-5 years)</option>
              <option value="expert">Expert (5+ years)</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <button className="nexus-action-btn" onClick={handleSubmit}>
            Complete Setup
          </button>
          <button className="nexus-back-btn" onClick={onClose}>
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}