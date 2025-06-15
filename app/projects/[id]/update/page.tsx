'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Save,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function UpdateProjectPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    progress: 0,
    status_update: '',
    hours_logged: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        setUser(user);

        // Fetch project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select(`
            *,
            client:user_profiles!projects_client_id_fkey(id, full_name, avatar_url)
          `)
          .eq('id', params.id)
          .single();

        if (projectError) {
          console.error('Project fetch error:', projectError);
          router.push('/projects');
          return;
        }

        // Check if user is the assigned developer
        if (project.developer_id !== user.id) {
          router.push('/unauthorized');
          return;
        }

        // Check if project is in progress
        if (project.status !== 'in_progress') {
          router.push(`/projects/${params.id}`);
          return;
        }

        setProject(project);
        
        // Get project tasks to calculate progress
        const { data: tasks } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', params.id);
        
        // Calculate progress based on completed tasks
        if (tasks && tasks.length > 0) {
          const completedTasks = tasks.filter(task => task.status === 'done').length;
          const progress = Math.round((completedTasks / tasks.length) * 100);
          setFormData(prev => ({ ...prev, progress }));
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth/signin');
      } finally {
        setInitialLoading(false);
      }
    };

    getUser();
  }, [params.id, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update project progress
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (projectError) {
        throw projectError;
      }

      // Add status update as a message
      if (formData.status_update.trim()) {
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: project.client.id,
            project_id: project.id,
            content: `Status Update: ${formData.status_update}`,
            read: false
          });

        if (messageError) {
          throw messageError;
        }
      }

      // Log hours if provided
      if (formData.hours_logged > 0) {
        // In a real app, you would update a time tracking table here
        console.log(`Logged ${formData.hours_logged} hours for project ${project.id}`);
      }

      setSuccess('Project updated successfully!');
      
      // Reset form
      setFormData({
        progress: formData.progress,
        status_update: '',
        hours_logged: 0
      });
      
      // Redirect to project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Project update error:', err);
      setError(err.message || 'Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-white mb-2">Project Not Found</h2>
          <p className="text-gray-400 mb-4">The project you're trying to update doesn't exist or you don't have permission.</p>
          <Link 
            href="/dashboard"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href={`/projects/${project.id}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Project
          </Link>
          <h1 className="text-3xl font-bold text-white">Update Project Status</h1>
          <p className="text-gray-400">Provide updates for {project.title}</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <p className="text-green-400">{success}</p>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Project Progress
              </label>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{formData.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                    style={{ width: `${formData.progress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Progress is calculated based on completed tasks. Update tasks to change progress.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Status Update
              </label>
              <div className="relative">
                <MessageSquare size={16} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={formData.status_update}
                  onChange={(e) => setFormData(prev => ({ ...prev, status_update: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 min-h-[150px]"
                  placeholder="Provide an update on your progress, challenges, or questions for the client..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Hours Logged
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={formData.hours_logged}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours_logged: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder="Hours worked since last update"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href={`/projects/${project.id}`}
                className="flex-1 border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Submit Update
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}