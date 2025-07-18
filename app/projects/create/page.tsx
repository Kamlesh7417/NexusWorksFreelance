'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ProjectSubmissionForm from '@/components/ai/project-submission-form';

export default function CreateProjectPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          router.push('/onboarding');
          return;
        }

        // Only clients can create projects
        if (profile.role !== 'client' && profile.role !== 'admin') {
          router.push('/unauthorized');
          return;
        }

        setProfile(profile);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth/signin');
      }
    };

    getUser();
  }, [router, supabase]);

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/projects"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
        </div>

        <ProjectSubmissionForm />
      </div>
    </div>
  );
}