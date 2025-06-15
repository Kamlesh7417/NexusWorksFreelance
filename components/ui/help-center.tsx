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
  ExternalLink
} from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: string;
}

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTopic, setActiveTopic] = useState<HelpTopic | null>(null);

  const helpTopics: HelpTopic[] = [
    {
      id: 'getting-started',
      title: 'Getting Started with NexusWorks',
      content: `
        <h3>Welcome to NexusWorks!</h3>
        <p>NexusWorks is a revolutionary freelancing platform that connects clients with elite developers using quantum AI matching technology.</p>
        <h4>Quick Start Guide:</h4>
        <ol>
          <li>Create your account and complete your profile</li>
          <li>Select your role (client, developer, or student)</li>
          <li>Browse projects or post your first project</li>
          <li>Use the AI assistant for personalized guidance</li>
        </ol>
        <p>Our platform uses advanced AI to ensure perfect matches between projects and developers, secure blockchain payments, and real-time collaboration tools.</p>
      `,
      category: 'basics'
    },
    {
      id: 'posting-project',
      title: 'How to Post a Project',
      content: `
        <h3>Posting Your First Project</h3>
        <p>Creating a project on NexusWorks is simple and enhanced by our AI project analyzer.</p>
        <h4>Steps to Post a Project:</h4>
        <ol>
          <li>Navigate to the Dashboard and click "Post New Project"</li>
          <li>Fill in the project details (title, description, budget, deadline)</li>
          <li>Specify required skills and project category</li>
          <li>Use the AI Analysis button for suggestions and improvements</li>
          <li>Review and publish your project</li>
        </ol>
        <p>Your project will be instantly matched with qualified developers based on skills, availability, and success rate.</p>
      `,
      category: 'clients'
    },
    {
      id: 'finding-projects',
      title: 'Finding and Bidding on Projects',
      content: `
        <h3>Finding the Perfect Projects</h3>
        <p>NexusWorks uses quantum AI matching to connect you with projects that match your skills and career goals.</p>
        <h4>How to Find and Bid on Projects:</h4>
        <ol>
          <li>Go to the Projects Marketplace</li>
          <li>Browse recommended projects or use search filters</li>
          <li>Review project details and requirements</li>
          <li>Submit a compelling bid with your proposal</li>
          <li>Set your price and estimated timeline</li>
        </ol>
        <p>Pro tip: Projects with a high match score (90%+) are ideal for your skill set and have a higher acceptance rate.</p>
      `,
      category: 'developers'
    },
    {
      id: 'payments',
      title: 'Secure Payments and Escrow',
      content: `
        <h3>Secure Blockchain Payments</h3>
        <p>NexusWorks uses advanced blockchain technology to ensure secure, transparent payments for all projects.</p>
        <h4>How Payments Work:</h4>
        <ol>
          <li>Clients fund project milestones using our secure escrow system</li>
          <li>Funds are held safely until work is completed and approved</li>
          <li>Developers receive payment automatically upon milestone approval</li>
          <li>All transactions are recorded on the blockchain for transparency</li>
        </ol>
        <p>Our platform supports multiple payment methods including cryptocurrency, bank transfers, and credit cards.</p>
      `,
      category: 'payments'
    },
    {
      id: 'messaging',
      title: 'Real-time Messaging System',
      content: `
        <h3>Communicating on NexusWorks</h3>
        <p>Our platform features a powerful real-time messaging system for seamless collaboration.</p>
        <h4>Messaging Features:</h4>
        <ol>
          <li>Instant messaging with project participants</li>
          <li>File sharing and code snippet support</li>
          <li>Project-specific conversation threads</li>
          <li>Real-time notifications for new messages</li>
          <li>Message read receipts and typing indicators</li>
        </ol>
        <p>All communications are encrypted end-to-end for complete privacy and security.</p>
      `,
      category: 'communication'
    }
  ];

  const filteredTopics = searchTerm
    ? helpTopics.filter(topic => 
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : helpTopics;

  const groupedTopics = filteredTopics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, HelpTopic[]>);

  const categoryLabels: Record<string, { name: string, icon: any }> = {
    'basics': { name: 'Platform Basics', icon: Book },
    'clients': { name: 'For Clients', icon: Briefcase },
    'developers': { name: 'For Developers', icon: Code },
    'payments': { name: 'Payments & Billing', icon: DollarSign },
    'communication': { name: 'Communication', icon: MessageSquare }
  };

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-cyan-500/20 transition-all duration-200"
        aria-label="Open Help Center"
      >
        <HelpCircle size={24} className="text-white" />
      </button>

      {/* Help Center Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-cyan-400">Help Center</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveTopic(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(80vh-64px)]">
              {/* Sidebar */}
              <div className="md:col-span-1 border-r border-white/10 overflow-y-auto">
                <div className="p-4">
                  <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search help topics..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {Object.entries(groupedTopics).map(([category, topics]) => {
                    const CategoryIcon = categoryLabels[category]?.icon || Book;
                    return (
                      <div key={category} className="mb-4">
                        <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-400 uppercase">
                          <CategoryIcon size={14} />
                          {categoryLabels[category]?.name || category}
                        </div>
                        <div className="mt-1 space-y-1">
                          {topics.map(topic => (
                            <button
                              key={topic.id}
                              onClick={() => setActiveTopic(topic)}
                              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between ${
                                activeTopic?.id === topic.id
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'hover:bg-white/5 text-gray-300'
                              }`}
                            >
                              <span>{topic.title}</span>
                              <ChevronRight size={16} className="opacity-50" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(groupedTopics).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No help topics found for "{searchTerm}"</p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-cyan-400 hover:text-cyan-300"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Help Options */}
                <div className="p-4 border-t border-white/10">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Additional Support</h3>
                  <div className="space-y-2">
                    <a
                      href="/contact"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300"
                    >
                      <MessageSquare size={16} className="text-cyan-400" />
                      <span>Contact Support</span>
                    </a>
                    <a
                      href="/documentation"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300"
                    >
                      <FileText size={16} className="text-purple-400" />
                      <span>Documentation</span>
                    </a>
                    <a
                      href="https://www.youtube.com/channel/nexusworks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300"
                    >
                      <Video size={16} className="text-red-400" />
                      <span>Video Tutorials</span>
                      <ExternalLink size={12} className="ml-auto" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="md:col-span-2 overflow-y-auto p-6">
                {activeTopic ? (
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4">{activeTopic.title}</h2>
                    <div 
                      className="prose prose-invert prose-cyan max-w-none"
                      dangerouslySetInnerHTML={{ __html: activeTopic.content }}
                    />
                    
                    <div className="mt-8 pt-4 border-t border-white/10">
                      <h3 className="text-lg font-medium text-white mb-3">Was this helpful?</h3>
                      <div className="flex gap-3">
                        <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 px-4 py-2 rounded-lg">
                          Yes, thanks!
                        </button>
                        <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg">
                          No, I need more help
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle size={64} className="mx-auto mb-4 text-cyan-400 opacity-50" />
                    <h2 className="text-2xl font-bold text-white mb-2">How can we help?</h2>
                    <p className="text-gray-400 mb-6">
                      Select a topic from the sidebar or search for specific help
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                      <a
                        href="/documentation"
                        className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-4 text-center"
                      >
                        <FileText size={24} className="mx-auto mb-2 text-purple-400" />
                        <span className="text-white">Documentation</span>
                      </a>
                      <a
                        href="/contact"
                        className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-4 text-center"
                      >
                        <MessageSquare size={24} className="mx-auto mb-2 text-cyan-400" />
                        <span className="text-white">Contact Support</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Import these icons for use in the component
import { Briefcase, Code, DollarSign } from 'lucide-react';