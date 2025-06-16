'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthButton } from '@/components/auth/auth-button';
import { HomePage } from '@/components/pages/home-page';
import { MarketplacePage } from '@/components/pages/marketplace-page';
import { EnhancedLearningPage } from '@/components/pages/enhanced-learning-page';
import { CommunityPage } from '@/components/pages/community-page';
import { EnhancedAIAssistant } from '@/components/ai/enhanced-ai-assistant';
import { NotificationBar } from '@/components/notifications/notification-bar';
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
      <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          
          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchPage('home');
                  }}
                  className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'home' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
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
                  className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'marketplace' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
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
                  className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'learning' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                >
                  Learning
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchPage('community');
                  }}
                  className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'community' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                >
                  Community
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <AuthButton />
            
            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <NotificationBar />
      <EnhancedAIAssistant />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'marketplace' && <MarketplacePage onPageChange={switchPage} />}
        {currentPage === 'learning' && <EnhancedLearningPage onPageChange={switchPage} />}
        {currentPage === 'community' && <CommunityPage onPageChange={switchPage} />}
      </main>
      
      <footer className="bg-black/80 backdrop-blur-lg border-t border-white/10 py-6 text-center">
        <div className="container mx-auto px-4">
          <p className="text-gray-400 mb-2">&copy; 2024 NexusWorks. Where Innovation Meets Opportunity.</p>
          <div className="flex justify-center gap-4 text-sm">
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Contact Us</a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
      
      {isLoading && <LoadingOverlay />}
    </div>
  );
}