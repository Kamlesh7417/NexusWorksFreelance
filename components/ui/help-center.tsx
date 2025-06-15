'use client';

import { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  Search, 
  Book, 
  MessageSquare, 
  Video, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: string;
}

const helpTopics: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with NexusWorks',
    content: 'NexusWorks is a futuristic freelancing platform that connects clients with elite developers. To get started, create an account, complete your profile, and explore projects or post your own.',
    category: 'basics'
  },
  {
    id: 'create-project',
    title: 'How to Create a Project',
    content: 'To create a project, navigate to the Projects section and click "Create Project". Fill in the details including title, description, budget, and required skills. Our AI will analyze your project and provide suggestions.',
    category: 'clients'
  },
  {
    id: 'submit-bid',
    title: 'How to Submit a Bid',
    content: 'To bid on a project, navigate to the project details page and click "Submit Bid". Enter your proposed amount and a compelling message explaining why you\'re the right fit for the project.',
    category: 'developers'
  },
  {
    id: 'messaging',
    title: 'Using the Messaging System',
    content: 'Our real-time messaging system allows you to communicate with clients or developers. Access your messages from the dashboard or by clicking the message icon in the header.',
    category: 'communication'
  },
  {
    id: 'payments',
    title: 'Payment Process and Security',
    content: 'NexusWorks uses a secure escrow system for all payments. Funds are only released to developers when milestones are completed and approved by the client.',
    category: 'payments'
  }
];

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { id: 'basics', name: 'Platform Basics', icon: Book },
    { id: 'clients', name: 'For Clients', icon: FileText },
    { id: 'developers', name: 'For Developers', icon: MessageSquare },
    { id: 'communication', name: 'Communication', icon: MessageSquare },
    { id: 'payments', name: 'Payments & Billing', icon: FileText }
  ];

  const filteredTopics = helpTopics.filter(topic => {
    const matchesSearch = searchTerm === '' || 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === null || topic.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Help Center"
      >
        <HelpCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
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

            <div className="flex h-[calc(80vh-130px)]">
              {/* Categories Sidebar */}
              <div className="w-1/3 border-r border-white/10 overflow-y-auto p-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left p-2 rounded mb-1 transition-colors ${
                    activeCategory === null ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5'
                  }`}
                >
                  All Topics
                </button>
                
                {categories.map(category => {
                  const CategoryIcon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-left p-2 rounded mb-1 transition-colors flex items-center gap-2 ${
                        activeCategory === category.id ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5'
                      }`}
                    >
                      <CategoryIcon size={16} />
                      {category.name}
                    </button>
                  );
                })}
                
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                  <h3 className="font-medium text-purple-400 mb-2">Need More Help?</h3>
                  <p className="text-sm text-gray-300 mb-2">Contact our support team for personalized assistance.</p>
                  <a 
                    href="/contact" 
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Contact Support
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Topics List */}
              <div className="w-2/3 overflow-y-auto p-4">
                {filteredTopics.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTopics.map(topic => (
                      <div key={topic.id} className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                          className="w-full text-left p-3 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium">{topic.title}</span>
                          {expandedTopic === topic.id ? (
                            <ChevronDown size={16} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                        </button>
                        
                        {expandedTopic === topic.id && (
                          <div className="p-3 bg-white/5">
                            <p className="text-gray-300 text-sm">{topic.content}</p>
                            <div className="mt-3 flex justify-between items-center">
                              <span className="text-xs text-gray-400">
                                Category: {categories.find(c => c.id === topic.category)?.name || topic.category}
                              </span>
                              <div className="flex gap-2">
                                <button className="text-xs text-cyan-400 hover:text-cyan-300">
                                  Helpful
                                </button>
                                <button className="text-xs text-cyan-400 hover:text-cyan-300">
                                  Not Helpful
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">No results found</p>
                    <p className="text-sm text-gray-500">Try a different search term or category</p>
                  </div>
                )}
                
                <div className="mt-6 border-t border-white/10 pt-4">
                  <h3 className="font-medium text-cyan-400 mb-3">Video Tutorials</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
                      <Video size={20} className="text-cyan-400 mb-2" />
                      <h4 className="font-medium text-sm mb-1">Getting Started</h4>
                      <p className="text-xs text-gray-400">3:45</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
                      <Video size={20} className="text-cyan-400 mb-2" />
                      <h4 className="font-medium text-sm mb-1">Project Creation</h4>
                      <p className="text-xs text-gray-400">5:12</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}