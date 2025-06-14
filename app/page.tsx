'use client';

import { useState, useEffect } from 'react';
import { AuthService, User } from '@/lib/auth';
import { LoginModal } from '@/components/auth/login-modal';
import { ClientDashboard } from '@/components/client/client-dashboard';
import { DeveloperDashboard } from '@/components/developer/developer-dashboard';
import { HomePage } from '@/components/pages/home-page';
import { MarketplacePage } from '@/components/pages/marketplace-page';
import { EnhancedLearningPage } from '@/components/pages/enhanced-learning-page';
import { CommunityPage } from '@/components/pages/community-page';
import { EnhancedAIAssistant } from '@/components/ai/enhanced-ai-assistant';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LogOut, User as UserIcon, Home, Briefcase, GraduationCap, Users } from 'lucide-react';

export type PageType = 'home' | 'marketplace' | 'learning' | 'community';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setCurrentPage('home');
  };

  const switchPage = (page: PageType) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 300);
  };

  // If user is logged in, show role-specific dashboard
  if (user) {
    if (user.role === 'client') {
      return <ClientDashboard />;
    } else if (user.role === 'developer') {
      return <DeveloperDashboard />;
    }
  }

  // Show public website with enhanced design
  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      
      {/* Enhanced Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-foreground">NexusWorks</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'marketplace', label: 'Marketplace', icon: Briefcase },
                { id: 'learning', label: 'Learning', icon: GraduationCap },
                { id: 'community', label: 'Community', icon: Users },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => switchPage(item.id as PageType)}
                    className={`nav-link ${currentPage === item.id ? 'nav-link-active' : ''}`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <a 
                href="/project-management" 
                className="btn-ghost text-sm"
              >
                Project Manager
              </a>
              <a 
                href="/supabase-demo" 
                className="btn-ghost text-sm"
              >
                Supabase Demo
              </a>
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn-outline"
              >
                <UserIcon size={16} />
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      <EnhancedAIAssistant />
      
      <main className="flex-1">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {currentPage === 'home' && <HomePage />}
            {currentPage === 'marketplace' && <MarketplacePage onPageChange={switchPage} />}
            {currentPage === 'learning' && <EnhancedLearningPage onPageChange={switchPage} />}
            {currentPage === 'community' && <CommunityPage onPageChange={switchPage} />}
          </>
        )}
      </main>
      
      {/* Enhanced Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">N</span>
                </div>
                <span className="font-semibold text-foreground">NexusWorks</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The future of freelancing with quantum AI and blockchain technology.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Platform</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Find Developers</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Post Projects</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Learning Hub</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Community</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Resources</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">API Reference</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Support</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Blog</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">About</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Careers</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2024 NexusWorks. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}