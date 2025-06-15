'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthButton } from '@/components/auth/auth-button';
import { HomePage } from '@/components/pages/home-page';
import { MarketplacePage } from '@/components/pages/marketplace-page';
import { EnhancedLearningPage } from '@/components/pages/enhanced-learning-page';
import { CommunityPage } from '@/components/pages/community-page';
import { EnhancedAIAssistant } from '@/components/ai/enhanced-ai-assistant';
import { BCIPanel } from '@/components/bci/bci-panel';
import { NotificationBar } from '@/components/notifications/notification-bar';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { HeroSection } from '@/components/landing/hero-section';
import { Loader2 } from 'lucide-react';

export type PageType = 'home' | 'marketplace' | 'learning' | 'community';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          // Redirect to dashboard on sign in
          window.location.href = '/dashboard';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const switchPage = (page: PageType) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* Header with Enhanced Navigation */}
        <header className="nexus-header">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <h1>NexusWorks</h1>
          </div>
          
          <nav className="nexus-nav">
            <ul>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchPage('home');
                  }}
                  className={currentPage === 'home' ? 'active' : ''}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchPage('marketplace');
                  }}
                  className={currentPage === 'marketplace' ? 'active' : ''}
                >
                  Marketplace
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchPage('learning');
                  }}
                  className={currentPage === 'learning' ? 'active' : ''}
                >
                  Developer Learning
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchPage('community');
                  }}
                  className={currentPage === 'community' ? 'active' : ''}
                >
                  Developer Community
                </a>
              </li>
              <li>
                <a href="/projects" className="text-cyan-400 hover:text-cyan-300">
                  Projects
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-green-400 hover:text-green-300">
                  Dashboard
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <AuthButton />
          </div>
        </header>

        <BCIPanel />
        <NotificationBar />
        <EnhancedAIAssistant />
        
        <main>
          {currentPage === 'home' && (
            <>
              <HeroSection />
              <HomePage />
            </>
          )}
          {currentPage === 'marketplace' && <MarketplacePage onPageChange={switchPage} />}
          {currentPage === 'learning' && <EnhancedLearningPage onPageChange={switchPage} />}
          {currentPage === 'community' && <CommunityPage onPageChange={switchPage} />}
        </main>
        
        <footer className="nexus-footer">
          <p>&copy; 2025 NexusWorks. The Future of Freelancing.</p>
          <div>
            <a href="/terms">Terms of Service</a> | <a href="/privacy">Privacy Policy</a> | <a href="/contact">Contact Us</a> | <a href="/support">Support</a>
          </div>
        </footer>
        
        {isLoading && <LoadingOverlay />}
      </div>
    </ErrorBoundary>
  );
}