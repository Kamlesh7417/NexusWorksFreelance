'use client';

import { useState } from 'react';
import { 
  Search, 
  HelpCircle, 
  Book, 
  FileText, 
  Video, 
  MessageSquare, 
  ChevronRight, 
  ChevronDown,
  X,
  ExternalLink
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  videoUrl?: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: any;
  articles: HelpArticle[];
}

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['getting-started']);

  // Sample help content
  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: Rocket,
      articles: [
        {
          id: 'welcome-to-nexusworks',
          title: 'Welcome to NexusWorks',
          category: 'getting-started',
          content: `
            <h2>Welcome to NexusWorks</h2>
            <p>NexusWorks is a revolutionary freelancing platform that combines AI enhancement, blockchain payments, and educational opportunities for developers and students.</p>
            <p>This guide will help you get started with the platform and make the most of its features.</p>
            <h3>Key Features</h3>
            <ul>
              <li>AI-powered project matching</li>
              <li>Secure blockchain payments</li>
              <li>Real-time collaboration tools</li>
              <li>Developer learning platform</li>
              <li>Project management system</li>
            </ul>
          `
        },
        {
          id: 'creating-your-profile',
          title: 'Creating Your Profile',
          category: 'getting-started',
          content: `
            <h2>Creating Your Profile</h2>
            <p>Your profile is your professional identity on NexusWorks. A complete profile increases your chances of finding projects or attracting quality developers.</p>
            <h3>Steps to Create a Great Profile</h3>
            <ol>
              <li>Add a professional profile picture</li>
              <li>Write a compelling bio that highlights your expertise</li>
              <li>List your skills accurately</li>
              <li>Set your hourly rate (for developers)</li>
              <li>Add your location and time zone</li>
              <li>Showcase your portfolio work</li>
            </ol>
            <p>Remember to keep your profile updated as you gain new skills and experience.</p>
          `
        }
      ]
    },
    {
      id: 'projects',
      name: 'Projects',
      icon: Briefcase,
      articles: [
        {
          id: 'posting-a-project',
          title: 'Posting a Project',
          category: 'projects',
          content: `
            <h2>Posting a Project</h2>
            <p>Creating a clear and detailed project posting is essential to attract the right developers.</p>
            <h3>How to Post a Project</h3>
            <ol>
              <li>Navigate to the Projects section and click "Post a Project"</li>
              <li>Fill in the project details:
                <ul>
                  <li>Title: Create a clear, descriptive title</li>
                  <li>Description: Provide detailed requirements</li>
                  <li>Budget: Set your minimum and maximum budget</li>
                  <li>Deadline: Choose a realistic timeline</li>
                  <li>Skills Required: List all necessary skills</li>
                </ul>
              </li>
              <li>Use the AI Analysis tool to get suggestions for your project</li>
              <li>Review and publish your project</li>
            </ol>
            <p>Our AI will automatically match your project with suitable developers based on skills, availability, and past performance.</p>
          `,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
          id: 'bidding-on-projects',
          title: 'Bidding on Projects',
          category: 'projects',
          content: `
            <h2>Bidding on Projects</h2>
            <p>As a developer, finding and bidding on the right projects is key to your success on NexusWorks.</p>
            <h3>How to Submit a Winning Bid</h3>
            <ol>
              <li>Browse the project marketplace or check your AI-recommended projects</li>
              <li>Read the project description thoroughly</li>
              <li>Prepare a personalized proposal that addresses the client's specific needs</li>
              <li>Set a competitive but fair price</li>
              <li>Highlight relevant experience and skills</li>
              <li>Submit your bid</li>
            </ol>
            <p>Remember, quality bids that demonstrate understanding of the project requirements are more likely to be accepted than the lowest-priced bids.</p>
          `
        }
      ]
    },
    {
      id: 'payments',
      name: 'Payments',
      icon: DollarSign,
      articles: [
        {
          id: 'payment-methods',
          title: 'Payment Methods',
          category: 'payments',
          content: `
            <h2>Payment Methods</h2>
            <p>NexusWorks offers multiple secure payment options for clients and developers.</p>
            <h3>Available Payment Methods</h3>
            <ul>
              <li>Credit/Debit Cards</li>
              <li>PayPal</li>
              <li>Bank Transfer</li>
              <li>Cryptocurrency (Bitcoin, Ethereum, USDC)</li>
            </ul>
            <h3>Blockchain Payments</h3>
            <p>Our platform uses blockchain technology to ensure secure, transparent transactions with lower fees and faster international transfers.</p>
            <p>All payments are held in escrow until project milestones are completed and approved.</p>
          `
        }
      ]
    },
    {
      id: 'learning',
      name: 'Learning Platform',
      icon: GraduationCap,
      articles: [
        {
          id: 'accessing-courses',
          title: 'Accessing Learning Resources',
          category: 'learning',
          content: `
            <h2>Accessing Learning Resources</h2>
            <p>NexusWorks offers comprehensive learning resources to help developers enhance their skills.</p>
            <h3>Available Learning Resources</h3>
            <ul>
              <li>Interactive Courses</li>
              <li>Coding Environments</li>
              <li>Expert Shadowing</li>
              <li>Skill Assessments</li>
              <li>Learning Paths</li>
            </ul>
            <p>To access these resources, navigate to the "Developer Learning" section from the main navigation.</p>
          `
        }
      ]
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectArticle = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const filteredCategories = helpCategories.map(category => ({
    ...category,
    articles: category.articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.articles.length > 0);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold p-3 rounded-full shadow-lg transition-all duration-200 z-50"
      >
        <HelpCircle size={24} />
      </button>

      {/* Help Center Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-cyan-400">Help Center</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedArticle(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex h-[calc(90vh-80px)]">
              {/* Sidebar */}
              <div className={`w-80 border-r border-white/10 flex flex-col ${selectedArticle ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4">
                  <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search help articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredCategories.map(category => {
                      const Icon = category.icon;
                      const isExpanded = expandedCategories.includes(category.id);
                      
                      return (
                        <div key={category.id}>
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={18} className="text-cyan-400" />
                              <span>{category.name}</span>
                            </div>
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          
                          {isExpanded && (
                            <div className="ml-8 mt-2 space-y-1">
                              {category.articles.map(article => (
                                <button
                                  key={article.id}
                                  onClick={() => selectArticle(article)}
                                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                                    selectedArticle?.id === article.id
                                      ? 'bg-cyan-500/20 text-cyan-400'
                                      : 'hover:bg-white/5 text-gray-300'
                                  }`}
                                >
                                  {article.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto p-4 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Need more help?</p>
                    <a
                      href="/contact"
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <MessageSquare size={14} />
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 overflow-y-auto p-6 ${selectedArticle ? 'block' : 'hidden md:block'}`}>
                {selectedArticle ? (
                  <div>
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="md:hidden flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                    >
                      <ChevronLeft size={16} />
                      Back to Articles
                    </button>
                    
                    <div className="prose prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                      
                      {selectedArticle.videoUrl && (
                        <div className="mt-6">
                          <h3 className="text-xl font-semibold text-white mb-4">Video Tutorial</h3>
                          <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
                            <iframe
                              src={selectedArticle.videoUrl}
                              title={selectedArticle.title}
                              className="absolute top-0 left-0 w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-8 pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400">Was this article helpful?</p>
                        <div className="flex gap-2 mt-2">
                          <button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm">
                            Yes
                          </button>
                          <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-6">Popular Articles</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {helpCategories.flatMap(category => 
                        category.articles.slice(0, 1).map(article => (
                          <button
                            key={article.id}
                            onClick={() => selectArticle(article)}
                            className="text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <h4 className="font-medium text-cyan-400 mb-2">{article.title}</h4>
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {article.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <FileText size={12} />
                              <span>{category.name}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mt-8 mb-6">Video Tutorials</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <a
                        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg mb-3">
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                            <Video size={32} className="text-white" />
                          </div>
                        </div>
                        <h4 className="font-medium text-cyan-400 mb-1">Getting Started with NexusWorks</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>5:32</span>
                        </div>
                      </a>
                      
                      <a
                        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-left p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg mb-3">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                            <Video size={32} className="text-white" />
                          </div>
                        </div>
                        <h4 className="font-medium text-cyan-400 mb-1">How to Create the Perfect Project</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>7:15</span>
                        </div>
                      </a>
                    </div>
                    
                    <div className="mt-8 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Book size={24} className="text-cyan-400" />
                        <div>
                          <h4 className="font-medium text-white">Documentation</h4>
                          <p className="text-sm text-gray-300">Access our comprehensive documentation for detailed guides</p>
                        </div>
                        <a
                          href="/docs"
                          className="ml-auto bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                        >
                          View Docs
                          <ExternalLink size={14} />
                        </a>
                      </div>
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

function ChevronLeft(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function DollarSign(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function GraduationCap(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}

function Clock(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function Briefcase(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function Rocket(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}