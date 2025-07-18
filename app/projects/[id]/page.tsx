'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ProjectProvider } from '@/components/dashboard/project-context';
import { ProjectManagementConsole } from '@/components/dashboard/project-management-console';
import { projectService } from '@/lib/services/project-service';
import { isSuccessResponse } from '@/lib/api-client';
import { 
  ArrowLeft, 
  Settings, 
  Share, 
  MoreVertical,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!session?.accessToken || !projectId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await projectService.getProject(projectId);
        
        if (!isSuccessResponse(response)) {
          throw new Error(response.error || 'Failed to load project');
        }

        setProject(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
        console.error('Error loading project:', err);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadProject();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, projectId, status, router]);

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Project</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl text-gray-600 mb-4">404</div>
          <h2 className="text-2xl font-bold text-white mb-2">Project Not Found</h2>
          <p className="text-gray-400 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <ProjectProvider user={session?.user} profile={{ role: 'developer' }}>
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-400" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-white">{project.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                  <span>Project ID: {project.id}</span>
                  <span className="capitalize">Status: {project.status}</span>
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 px-4 py-2 rounded-lg transition-colors"
                title="Share Project"
              >
                <Share className="h-4 w-4" />
                Share
              </button>
              
              <button
                className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 px-4 py-2 rounded-lg transition-colors"
                title="Project Settings"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <div className="relative group">
                <button className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <MoreVertical className="h-5 w-5 text-gray-400" />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
                  <button className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors w-full text-left">
                    <ExternalLink className="h-4 w-4" />
                    View in GitHub
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors w-full text-left">
                    Export Data
                  </button>
                  <hr className="border-gray-700 my-1" />
                  <button className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors w-full text-left">
                    Archive Project
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Project Management Console */}
          <ProjectManagementConsole 
            projectId={projectId}
            className="mb-6"
          />
        </div>
      </ProjectProvider>
    </div>
  );
}