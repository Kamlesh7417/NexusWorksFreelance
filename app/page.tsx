'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/components/auth/login-modal';
import { ClientDashboard } from '@/components/client/client-dashboard';
import { DeveloperDashboard } from '@/components/developer/developer-dashboard';
import { HomePage } from '@/components/pages/home-page';
import { MarketplacePage } from '@/components/pages/marketplace-page';
import { EnhancedLearningPage } from '@/components/pages/enhanced-learning-page';
import { CommunityPage } from '@/components/pages/community-page';
import { EnhancedAIAssistant } from '@/components/ai/enhanced-ai-assistant';
import { BCIPanel } from '@/components/bci/bci-panel';
import { NotificationBar } from '@/components/notifications/notification-bar';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { LogOut, User as UserIcon, Home as HomeIcon } from 'lucide-react';
import { AuthStatus } from '@/components/auth/auth-status';

export type PageType = 'home' | 'marketplace' | 'learning' | 'community';

export default function Home() {
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isLoading, setIsLoading] = useState(false);

  const switchPage = (page: PageType) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 500);
  };

  // If user is logged in, show role-specific dashboard
  if (session?.user) {
    if (session.user.role === 'client') {
      return <ClientDashboard />;
    } else if (session.user.role === 'developer' || session.user.role === 'freelancer' || session.user.role === 'student') {
      return <DeveloperDashboard />;
    }
  }

  // Show public website with proper navigation
  return (
    <div className="min-h-screen">
      {/* Header with Role-Based Navigation */}
      <header className="nexus-header">
        <h1>NexusWorks</h1>
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
              <AuthStatus />
            </li>
          </ul>
        </nav>
      </header>

      <BCIPanel />
      <NotificationBar />
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}