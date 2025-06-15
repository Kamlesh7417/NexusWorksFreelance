'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X, Search, ChevronRight, ArrowLeft, ExternalLink } from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
}

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [articles] = useState<HelpArticle[]>([
    {
      id: 'getting-started',
      title: 'Getting Started with NexusWorks',
      category: 'Basics',
      content: `
        <h2>Welcome to NexusWorks!</h2>
        <p>NexusWorks is a revolutionary freelancing platform that connects clients with elite developers using quantum AI matching technology.</p>
        
        <h3>Quick Start Guide</h3>
        <ol>
          <li>Create your account using GitHub authentication</li>
          <li>Complete your profile with skills and experience</li>
          <li>Browse available projects or post your own</li>
          <li>Use the AI matching system to find perfect matches</li>
          <li>Communicate through our real-time messaging system</li>
        </ol>
        
        <h3>Key Features</h3>
        <ul>
          <li>Quantum AI matching for perfect client-developer pairing</li>
          <li>Blockchain-secured payments and contracts</li>
          <li>Real-time collaboration tools</li>
          <li>Developer learning platform</li>
          <li>Global talent pool across 120+ countries</li>
        </ul>
      `
    },
    {
      id: 'client-guide',
      title: 'Client Guide: Posting Projects',
      category: 'For Clients',
      content: `
        <h2>How to Post a Project</h2>
        <p>Posting a project on NexusWorks is simple and designed to help you find the perfect developer.</p>
        
        <h3>Step-by-Step Guide</h3>
        <ol>
          <li>Navigate to your dashboard and click "Post a Project"</li>
          <li>Fill in the project details including title, description, and budget</li>
          <li>Specify required skills and project timeline</li>
          <li>Use our AI analysis tool for project complexity assessment</li>
          <li>Review and publish your project</li>
        </ol>
        
        <h3>Tips for Better Matches</h3>
        <ul>
          <li>Be specific about required skills and technologies</li>
          <li>Provide clear deliverables and acceptance criteria</li>
          <li>Set realistic budgets and timelines</li>
          <li>Include examples or references when possible</li>
        </ul>
      `
    },
    {
      id: 'developer-guide',
      title: 'Developer Guide: Finding Projects',
      category: 'For Developers',
      content: `
        <h2>Finding and Winning Projects</h2>
        <p>NexusWorks uses advanced AI to match you with projects that fit your skills and experience.</p>
        
        <h3>Finding Projects</h3>
        <ol>
          <li>Complete your profile with detailed skills and experience</li>
          <li>Browse the marketplace or check your AI-recommended matches</li>
          <li>Review project details carefully before applying</li>
          <li>Submit a compelling proposal that addresses client needs</li>
        </ol>
        
        <h3>Tips for Winning Projects</h3>
        <ul>
          <li>Highlight relevant experience in your proposal</li>
          <li>Address specific project requirements</li>
          <li>Ask clarifying questions to show engagement</li>
          <li>Provide a realistic timeline and approach</li>
          <li>Respond promptly to client messages</li>
        </ul>
      `
    },
    {
      id: 'messaging-system',
      title: 'Using the Messaging System',
      category: 'Communication',
      content: `
        <h2>Real-Time Messaging System</h2>
        <p>Our messaging system enables seamless communication between clients and developers.</p>
        
        <h3>Key Features</h3>
        <ul>
          <li>Real-time message delivery</li>
          <li>Project-specific conversations</li>
          <li>File sharing capabilities</li>
          <li>Read receipts</li>
          <li>Browser notifications</li>
        </ul>
        
        <h3>How to Use</h3>
        <ol>
          <li>Access messages from the navigation bar</li>
          <li>Select a conversation to view message history</li>
          <li>Type your message and press Enter or click Send</li>
          <li>Attach files using the paperclip icon</li>
          <li>Use emoji reactions for quick responses</li>
        </ol>
      `
    },
    {
      id: 'payment-system',
      title: 'Payments and Billing',
      category: 'Finances',
      content: `
        <h2>Secure Payment System</h2>
        <p>NexusWorks uses blockchain technology to ensure secure and transparent payments.</p>
        
        <h3>For Clients</h3>
        <ul>
          <li>Funds are held in escrow until work is approved</li>
          <li>Release payments by milestones</li>
          <li>Multiple payment methods supported</li>
          <li>Transparent fee structure</li>
        </ul>
        
        <h3>For Developers</h3>
        <ul>
          <li>Receive payments securely through blockchain</li>
          <li>Track earnings in your dashboard</li>
          <li>Multiple withdrawal options</li>
          <li>Automatic invoicing system</li>
        </ul>
      `
    }
  ]);

  useEffect(() => {
    // Close help center when pressing Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedArticles = filteredArticles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full p-3 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-110"
        aria-label="Help Center"
      >
        <HelpCircle size={24} />
      </button>

      {/* Help Center Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              {selectedArticle ? (
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Help Center
                </button>
              ) : (
                <h2 className="text-xl font-bold text-cyan-400">Help Center</h2>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar (only shown in main view) */}
            {!selectedArticle && (
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for help..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedArticle ? (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">{selectedArticle.title}</h2>
                  <div 
                    className="prose prose-invert prose-cyan max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-gray-400 text-sm">
                      Was this article helpful? <a href="#" className="text-cyan-400 hover:underline">Yes</a> / <a href="#" className="text-cyan-400 hover:underline">No</a>
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      For more detailed help, please <a href="/contact" className="text-cyan-400 hover:underline">contact support</a>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedArticles).length > 0 ? (
                    Object.entries(groupedArticles).map(([category, articles]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold text-cyan-400 mb-3">{category}</h3>
                        <div className="space-y-2">
                          {articles.map(article => (
                            <button
                              key={article.id}
                              onClick={() => setSelectedArticle(article)}
                              className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-between"
                            >
                              <span className="text-white">{article.title}</span>
                              <ChevronRight size={16} className="text-gray-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-2">No articles found matching "{searchTerm}"</p>
                      <p className="text-sm text-gray-500">Try a different search term or browse categories</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-3">Additional Resources</h3>
                    <div className="space-y-2">
                      <a 
                        href="/documentation" 
                        target="_blank"
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <span className="text-white">Full Documentation</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a 
                        href="/tutorials" 
                        target="_blank"
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <span className="text-white">Video Tutorials</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                      <a 
                        href="/faq" 
                        target="_blank"
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <span className="text-white">Frequently Asked Questions</span>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}