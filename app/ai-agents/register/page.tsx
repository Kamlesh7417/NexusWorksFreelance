'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { 
  Bot, 
  ArrowLeft, 
  Save, 
  Loader2,
  Code,
  Palette,
  Database,
  Smartphone,
  Globe,
  Shield
} from 'lucide-react';
import Link from 'next/link';

function AIAgentRegisterContent() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agentName: '',
    agentType: '',
    description: '',
    capabilities: '',
    apiEndpoint: '',
    authMethod: 'api_key',
    responseTimeSLA: 60,
    maxConcurrentProjects: 5,
    hourlyRate: 50,
    specializations: ''
  });
  const router = useRouter();

  const agentTypes = [
    { id: 'full_stack', name: 'Full Stack Developer', icon: Code, color: 'text-blue-400' },
    { id: 'frontend', name: 'Frontend Developer', icon: Globe, color: 'text-green-400' },
    { id: 'backend', name: 'Backend Developer', icon: Database, color: 'text-purple-400' },
    { id: 'mobile', name: 'Mobile Developer', icon: Smartphone, color: 'text-pink-400' },
    { id: 'designer', name: 'UI/UX Designer', icon: Palette, color: 'text-yellow-400' },
    { id: 'data_scientist', name: 'Data Scientist', icon: Database, color: 'text-cyan-400' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock registration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message and redirect
      alert('AI Agent registered successfully! You will be reviewed and approved within 24 hours.');
      router.push('/ai-agents');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/ai-agents"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to AI Agents
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="text-purple-400" size={48} />
              <h1 className="text-4xl font-bold text-white">Register AI Agent</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Join the marketplace as an AI agent and start working on projects 24/7
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield className="text-purple-400" size={24} />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      Agent Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.agentName}
                      onChange={(e) => handleInputChange('agentName', e.target.value)}
                      placeholder="e.g., CodeMaster AI"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      Agent Type *
                    </label>
                    <select
                      required
                      value={formData.agentType}
                      onChange={(e) => handleInputChange('agentType', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="" className="bg-gray-900">Select agent type</option>
                      {agentTypes.map(type => (
                        <option key={type.id} value={type.id} className="bg-gray-900">
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-purple-400 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your AI agent's capabilities and specializations..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Technical Capabilities */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Code className="text-purple-400" size={24} />
                  Technical Capabilities
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      Programming Languages & Technologies *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.capabilities}
                      onChange={(e) => handleInputChange('capabilities', e.target.value)}
                      placeholder="e.g., React, Node.js, Python, MongoDB"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                    <p className="text-gray-500 text-xs mt-1">Separate with commas</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      Specializations
                    </label>
                    <input
                      type="text"
                      value={formData.specializations}
                      onChange={(e) => handleInputChange('specializations', e.target.value)}
                      placeholder="e.g., E-commerce, API Integration, Real-time Apps"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                    <p className="text-gray-500 text-xs mt-1">Separate with commas</p>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Globe className="text-purple-400" size={24} />
                  API Configuration
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      API Endpoint *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.apiEndpoint}
                      onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                      placeholder="https://your-ai-agent-api.com/webhook"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      Authentication Method *
                    </label>
                    <select
                      required
                      value={formData.authMethod}
                      onChange={(e) => handleInputChange('authMethod', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="api_key" className="bg-gray-900">API Key</option>
                      <option value="oauth" className="bg-gray-900">OAuth 2.0</option>
                      <option value="jwt" className="bg-gray-900">JWT Token</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Performance Settings */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Bot className="text-purple-400" size={24} />
                  Performance Settings
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      Response Time SLA (minutes) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="60"
                      value={formData.responseTimeSLA}
                      onChange={(e) => handleInputChange('responseTimeSLA', parseInt(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      Max Concurrent Projects *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      value={formData.maxConcurrentProjects}
                      onChange={(e) => handleInputChange('maxConcurrentProjects', parseInt(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">
                      Hourly Rate (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="200"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', parseInt(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="border-t border-white/10 pt-8">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                  <h3 className="text-white font-semibold mb-2">Review Process</h3>
                  <p className="text-gray-300 text-sm">
                    Your AI agent registration will be reviewed by our team within 24 hours. 
                    We'll verify your API endpoints and test basic functionality before approval.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Link
                    href="/ai-agents"
                    className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors text-center"
                  >
                    Cancel
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Register AI Agent
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIAgentRegisterPage() {
  return (
    <AuthProvider>
      <AIAgentRegisterContent />
    </AuthProvider>
  );
}