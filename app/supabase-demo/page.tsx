'use client';

import { SupabaseAuthProvider } from '@/contexts/supabase-auth-context';
import { SupabaseLogin } from '@/components/auth/supabase-login';
import { ProjectManager } from '@/components/supabase/project-manager';
import { RealTimeNotifications } from '@/components/supabase/real-time-notifications';
import { FileUpload } from '@/components/supabase/file-upload';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';
import { useState } from 'react';
import { LogOut, User, Upload, MessageSquare, FolderOpen } from 'lucide-react';

function SupabaseDemoContent() {
  const { user, profile, signOut, loading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'files' | 'messages'>('projects');

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SupabaseLogin />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <RealTimeNotifications />
      
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">NexusWorks Supabase Demo</h1>
            <p className="text-gray-400">Real-time project management with Supabase</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <User size={16} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">{profile?.full_name || user.email}</p>
                <p className="text-xs text-gray-400 capitalize">{profile?.role || 'User'}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/5 border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 max-w-md">
            {[
              { id: 'projects', label: 'Projects', icon: FolderOpen },
              { id: 'files', label: 'File Upload', icon: Upload },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'projects' && <ProjectManager />}
          
          {activeTab === 'files' && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6">File Upload Demo</h2>
              <FileUpload
                bucket="project-files"
                path={`users/${user.id}`}
                accept="image/*,.pdf,.doc,.docx,.txt"
                maxSize={10}
                onUploadComplete={(url, path) => {
                  console.log('File uploaded:', { url, path });
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>
          )}
          
          {activeTab === 'messages' && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
              <MessageSquare size={64} className="mx-auto mb-4 text-gray-400 opacity-50" />
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">Messages</h2>
              <p className="text-gray-400">
                Real-time messaging system would be implemented here.
                Check the notifications in the top-right corner for real-time updates!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SupabaseDemoPage() {
  return (
    <SupabaseAuthProvider>
      <SupabaseDemoContent />
    </SupabaseAuthProvider>
  );
}