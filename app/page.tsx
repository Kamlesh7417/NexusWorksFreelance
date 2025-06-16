'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthButton } from '@/components/auth/auth-button';
import { HomePage } from '@/components/pages/home-page';
import { MarketplacePage } from '@/components/pages/marketplace-page';
import { EnhancedLearningPage } from '@/components/pages/enhanced-learning-page';
import { CommunityPage } from '@/components/pages/community-page';
import { EnhancedAIAssistant } from '@/components/ai/enhanced-ai-assistant';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Logo } from '@/components/ui/logo';

export type PageType = 'home' | 'marketplace' | 'learning' | 'community';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
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

  return (
    <div className="min-h-screen">
      {/* Header with Enhanced Navigation */}
      <header className="nexus-header">
        <div className="flex items-center gap-4">
          <Logo size="medium" />
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
              <a href="/project-management" className="text-purple-400 hover:text-purple-300">
                Project Manager
              </a>
            </li>
            <li>
              <a href="/supabase-demo" className="text-green-400 hover:text-green-300">
                Supabase Demo
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <AuthButton />
        </div>
      </header>

      <EnhancedAIAssistant />
      
      <main className="nexus-container">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'marketplace' && <MarketplacePage onPageChange={switchPage} />}
        {currentPage === 'learning' && <EnhancedLearningPage onPageChange={switchPage} />}
        {currentPage === 'community' && <CommunityPage onPageChange={switchPage} />}
      </main>
      
      <footer className="nexus-footer">
        <p>&copy; 2024 NexusWorks. The Future of Freelancing.</p>
        <div>
          <a href="#">Terms of Service</a> | <a href="#">Privacy Policy</a> | <a href="#">Contact Us</a> | <a href="#">Support</a>
        </div>
      </footer>
      
      {isLoading && <LoadingOverlay />}
    </div>
  );
}