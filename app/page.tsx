'use client';

import { useState } from 'react';
import Image from 'next/image';

import { AuthButton } from '@/components/auth/auth-button';
import { HomePage } from '@/components/pages/home-page';
import { MarketplacePage } from '@/components/pages/marketplace-page';
import { EnhancedLearningPage } from '@/components/pages/enhanced-learning-page';
import { CommunityPage } from '@/components/pages/community-page';
import EnhancedAIAssistant from '@/components/ai/enhanced-ai-assistant';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Logo } from '@/components/ui/logo';
import { DjangoAuthProvider } from '@/components/auth/django-auth-provider';

export type PageType = 'home' | 'marketplace' | 'learning' | 'community';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isLoading, setIsLoading] = useState(false);

  const switchPage = (page: PageType) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 300);
  };

  return (
    <DjangoAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Header with Enhanced Navigation */}
        <header className="nexus-header">
          <div className="flex items-center gap-4">
            {/* <Logo size="medium" /> */}
            <Image
              src="/images/logo.png"
              alt="NexusWorks Logo"
              width={40}  // or any size you want
              height={40}
              className="object-contain"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              NexusWorks
            </h1>
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
                  className={currentPage === 'community' ? 'active' : ''}
                >
                  Community
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Dashboard
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
          <div className="transition-all duration-300 ease-in-out">
            {currentPage === 'home' && <HomePage />}
            {currentPage === 'marketplace' && <MarketplacePage onPageChange={switchPage} />}
            {currentPage === 'learning' && <EnhancedLearningPage onPageChange={switchPage} />}
            {currentPage === 'community' && <CommunityPage onPageChange={switchPage} />}
          </div>
        </main>

        <footer className="nexus-footer">
          <div className="max-w-6xl mx-auto">
            <p>&copy; 2024 NexusWorks. The Future of Freelancing.</p>
            <div className="mt-2">
              <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a> |
              <a href="#" className="hover:text-cyan-400 transition-colors"> Privacy Policy</a> |
              <a href="#" className="hover:text-cyan-400 transition-colors"> Contact Us</a> |
              <a href="#" className="hover:text-cyan-400 transition-colors"> Support</a>
            </div>
          </div>
        </footer>

        {isLoading && <LoadingOverlay />}
      </div>
    </DjangoAuthProvider>
  );
}