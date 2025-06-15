'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X, Search, Book, MessageSquare, FileText, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface HelpItem {
  id: string;
  title: string;
  content: string;
  category: string;
}

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Mock help center data
  const helpItems: HelpItem[] = [
    {
      id: 'getting-started-1',
      title: 'How do I create an account?',
      content: 'To create an account, click on "Sign In" in the top right corner and select "Sign in with GitHub". Follow the prompts to authorize NexusWorks to access your GitHub account.',
      category: 'Getting Started'
    },
    {
      id: 'getting-started-2',
      title: 'How do I complete my profile?',
      content: 'After signing in, you\'ll be guided through our onboarding process. You can update your profile anytime by clicking on your avatar in the top right corner and selecting "Profile".',
      category: 'Getting Started'
    },
    {
      id: 'projects-1',
      title: 'How do I create a new project?',
      content: 'To create a new project, go to your dashboard and click on "Post a Project" button. Fill in the project details including title, description, budget, and required skills.',
      category: 'Projects'
    },
    {
      id: 'projects-2',
      title: 'How do I bid on a project?',
      content: 'Browse available projects in the marketplace. When you find a project you\'re interested in, click on it to view details. Scroll down to the bidding section and submit your proposal and bid amount.',
      category: 'Projects'
    },
    {
      id: 'payments-1',
      title: 'How do payments work?',
      content: 'NexusWorks uses a secure escrow system. Clients fund milestones before work begins. When a milestone is completed and approved, the payment is released to the developer.',
      category: 'Payments'
    },
    {
      id: 'payments-2',
      title: 'What payment methods are accepted?',
      content: 'We currently support credit/debit cards, PayPal, and cryptocurrency payments including Bitcoin, Ethereum, and our native WORK token.',
      category: 'Payments'
    },
    {
      id: 'communication-1',
      title: 'How do I message another user?',
      content: 'You can message users directly from their profile, from a project page, or from the messages section in your dashboard. All communication is encrypted and stored securely.',
      category: 'Communication'
    },
    {
      id: 'communication-2',
      title: 'Are there notification settings?',
      content: 'Yes, you can customize your notification preferences in your account settings. We support email, in-app, and browser notifications for important updates.',
      category: 'Communication'
    }
  ];

  // Get unique categories
  const categories = Array.from(new Set(helpItems.map(item => item.category)));

  // Filter items based on search and category
  const filteredItems = helpItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === null || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  useEffect(() => {
    // Reset expanded items when category or search changes
    setExpandedItems([]);
  }, [activeCategory, searchTerm]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
        aria-label="Open Help Center"
      >
        <HelpCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      
      <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden z-10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-cyan-400">Help Center</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
        
        <div className="flex h-[calc(80vh-120px)]">
          {/* Categories Sidebar */}
          <div className="w-48 border-r border-white/10 p-4 overflow-y-auto hidden md:block">
            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                activeCategory === null 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              All Categories
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                  activeCategory === category 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
            
            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg">
              <h3 className="font-medium text-cyan-400 mb-2">Need more help?</h3>
              <p className="text-sm text-gray-300 mb-3">
                Contact our support team for personalized assistance.
              </p>
              <a 
                href="mailto:support@nexusworks.in"
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Contact Support
                <ArrowRight size={12} />
              </a>
            </div>
          </div>
          
          {/* Help Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Mobile Categories */}
            <div className="mb-4 md:hidden">
              <select
                value={activeCategory || ''}
                onChange={(e) => setActiveCategory(e.target.value || null)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {filteredItems.length > 0 ? (
              <div className="space-y-4">
                {filteredItems.map(item => (
                  <div 
                    key={item.id}
                    className="border border-white/10 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Book size={18} className="text-cyan-400" />
                        <span className="font-medium text-white">{item.title}</span>
                      </div>
                      {expandedItems.includes(item.id) ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </button>
                    
                    {expandedItems.includes(item.id) && (
                      <div className="p-4 border-t border-white/10 bg-white/5">
                        <p className="text-gray-300">{item.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or browse all categories
                </p>
              </div>
            )}
            
            {/* Help Resources */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={18} className="text-cyan-400" />
                  <h3 className="font-medium text-white">Documentation</h3>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Explore our comprehensive documentation for detailed guides.
                </p>
                <a 
                  href="/docs"
                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  View Documentation
                  <ArrowRight size={12} />
                </a>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={18} className="text-purple-400" />
                  <h3 className="font-medium text-white">Community Forum</h3>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Join discussions and get help from the community.
                </p>
                <a 
                  href="/community"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Visit Forum
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}