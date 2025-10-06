'use client';

import { DemoCredentials } from '@/components/demo/demo-credentials';
// import { AuthTest } from '@/components/auth/auth-test';
import { DjangoAuthProvider } from '@/components/auth/django-auth-provider';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <DjangoAuthProvider>
      <div className="min-h-screen bg-black animate-fadeIn">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link 
              href="/"
              className="nexus-back-btn inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DemoCredentials />
            {/* <AuthTest /> */}
          </div>
        </div>
      </div>
    </DjangoAuthProvider>
  );
}