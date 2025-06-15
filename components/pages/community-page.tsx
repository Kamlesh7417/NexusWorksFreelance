'use client';

import { PageType } from '@/app/page';
import { Users, Code, Trophy, MessageSquare, Calendar, Target, AlertCircle } from 'lucide-react';

interface CommunityPageProps {
  onPageChange: (page: PageType) => void;
}

export function CommunityPage({ onPageChange }: CommunityPageProps) {
  return (
    <div>
      <div className="nexus-welcome-section">
        <h1>Developer Community & Impact</h1>
        <p className="mb-4">Connect with fellow developers, join events, and contribute to global technology goals</p>
        
        {/* Developer-Only Notice */}
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-purple-400" />
            <span className="font-medium text-purple-400">Community Hub</span>
          </div>
          <p className="text-sm text-gray-300">
            This community space is exclusively for developers to network, collaborate, and participate in 
            technology-focused events and discussions. Login as a developer to join the conversation.
          </p>
        </div>
        
        <button 
          className="nexus-back-btn" 
          onClick={() => onPageChange('home')}
        >
          Back to Home
        </button>
      </div>

      <div className="nexus-dashboard">
        {/* Developer Events */}
        <div className="nexus-card">
          <h2>Developer Events & Hackathons</h2>
          <p>Join global developer events to network and collaborate on cutting-edge projects.</p>
          <div className="w-full h-[200px] bg-gradient-to-r from-purple-600 to-blue-500 mt-4 rounded-lg relative flex items-center justify-center">
            <div className="w-[150px] h-[150px] rounded-full bg-black/30 border-4 border-cyan-500/50 flex items-center justify-center animate-spin" style={{ animationDuration: '10s' }}>
              <div className="text-white text-xl text-center">Join Events</div>
            </div>
            <div className="absolute bottom-2 w-[90%] bg-black/50 border border-cyan-500/30 rounded-lg p-2 text-xs">
              <div className="flex justify-between mb-1">
                <span>1. CodeMasters</span>
                <span>12,450 pts</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>2. DataWizards</span>
                <span>11,980 pts</span>
              </div>
              <div className="flex justify-between">
                <span>3. Design Innovators</span>
                <span>10,750 pts</span>
              </div>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto mt-4">
            {[
              {
                title: "Web Development Hackathon",
                desc: "Dec 15 | Online | Prize: 5,000 USD",
                details: "Theme: Build web applications for real-world problems. Teams of 3-5 developers.",
                type: "Hackathon"
              },
              {
                title: "AI Ethics Workshop",
                desc: "Dec 22 | Hybrid (SF + Virtual) | Free Entry",
                details: "Learn about responsible AI development from industry leaders and researchers.",
                type: "Workshop"
              },
              {
                title: "Blockchain Security Summit",
                desc: "Jan 5 | Online | Prize: 8,000 USD",
                details: "Focus on smart contract security and DeFi protocol development.",
                type: "Summit"
              },
              {
                title: "Mobile App Developer Meetup",
                desc: "Jan 12 | Virtual | Free",
                details: "Monthly meetup for mobile developers to share projects and techniques.",
                type: "Meetup"
              }
            ].map((event, index) => (
              <div key={index} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-cyan-400 font-semibold">{event.title}</div>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                    {event.type}
                  </span>
                </div>
                <div className="text-sm mb-1">{event.desc}</div>
                <div className="text-xs opacity-80 mb-2">{event.details}</div>
                <button className="nexus-action-btn px-3 py-1 text-sm">RSVP Now</button>
              </div>
            ))}
          </div>
          <button className="nexus-action-btn">View Full Calendar</button>
        </div>

        {/* Developer Impact Dashboard */}
        <div className="nexus-card">
          <h2>Developer Impact Metrics</h2>
          <p>Track community-wide contributions to technology advancement and global development goals.</p>
          <div className="nexus-progress-container mt-4">
            <div className="nexus-progress-label">
              <span>Open Source Contributions</span>
              <span>85%</span>
            </div>
            <div className="nexus-progress-bar">
              <div className="nexus-progress" style={{ width: '85%' }}></div>
            </div>
            <div className="nexus-progress-label mt-2">
              <span>Knowledge Sharing</span>
              <span>72%</span>
            </div>
            <div className="nexus-progress-bar">
              <div className="nexus-progress" style={{ width: '72%' }}></div>
            </div>
            <div className="nexus-progress-label mt-2">
              <span>Mentorship Programs</span>
              <span>68%</span>
            </div>
            <div className="nexus-progress-bar">
              <div className="nexus-progress" style={{ width: '68%' }}></div>
            </div>
          </div>
          <div className="mt-4 text-sm text-left">
            <div className="mb-2 font-semibold">Community Impact Stats:</div>
            <ul className="pl-6 space-y-1">
              <li>Open Source Projects: 1,245 active repositories</li>
              <li>Code Contributions: 45,600+ commits this month</li>
              <li>Developer Mentorships: 2,800 active pairs</li>
              <li>Knowledge Articles: 8,900+ technical guides shared</li>
              <li>Global Reach: 15,400+ developers across 78 countries</li>
            </ul>
          </div>
          <button className="nexus-action-btn">Contribute to Impact</button>
        </div>

        {/* Developer Reputation & Rankings */}
        <div className="nexus-card">
          <h2>Developer Reputation System</h2>
          <p>Build your reputation and see top contributors in the developer community.</p>
          <div className="max-h-[300px] overflow-y-auto mt-4">
            {[
              { name: "Alexandra Reed", specialty: "Full Stack Development", score: 9850 },
              { name: "Marcus Tan", specialty: "Mobile Development", score: 9420 },
              { name: "Sofia Mendes", specialty: "Blockchain Security", score: 9180 },
              { name: "James Okoro", specialty: "AI/ML Engineering", score: 8950 },
              { name: "Li Wei Zhang", specialty: "DevOps & Cloud", score: 8720 },
              { name: "Elena Rivera", specialty: "Full Stack", score: 8500 }
            ].map((dev, index) => (
              <div key={index} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-semibold text-cyan-400">#{index + 1} {dev.name}</div>
                  <div className="text-xs text-gray-400">{dev.specialty}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-400">{dev.score.toLocaleString()}</div>
                  <button className="bg-cyan-500/20 border border-cyan-500/40 text-white px-2 py-1 rounded-md text-xs hover:bg-cyan-500/40 transition-all">
                    Endorse
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-left">
            <div className="mb-2 font-semibold">Your Community Stats:</div>
            <ul className="pl-6 space-y-1">
              <li>Reputation Score: 7,890 (Top 15%)</li>
              <li>Community Rank: #24 globally</li>
              <li>Contributions: 12 Projects, 5 Events, 8 Mentorships</li>
              <li>Endorsements Received: 156 from peers</li>
            </ul>
          </div>
          <button className="nexus-action-btn">View Full Rankings</button>
        </div>

        {/* Developer Forums & Discussions */}
        <div className="nexus-card">
          <h2>Developer Forums</h2>
          <p>Discuss emerging technologies, share knowledge, and collaborate with fellow developers.</p>
          <div className="max-h-[300px] overflow-y-auto mt-4">
            {[
              {
                title: "Web Development",
                desc: 'Topic: "Modern Frontend Frameworks" | Posts: 89 | Last: 1 hour ago',
                category: "Web"
              },
              {
                title: "AI & Machine Learning",
                desc: 'Topic: "Transformer Architecture Optimization" | Posts: 156 | Last: 3 hours ago',
                category: "AI/ML"
              },
              {
                title: "Blockchain Development",
                desc: 'Topic: "Layer 2 Scaling Solutions" | Posts: 67 | Last: 5 hours ago',
                category: "Blockchain"
              },
              {
                title: "Mobile Development",
                desc: 'Topic: "Cross-Platform Best Practices" | Posts: 43 | Last: 8 hours ago',
                category: "Mobile"
              },
              {
                title: "Cybersecurity Hub",
                desc: 'Topic: "Zero-Trust Architecture" | Posts: 78 | Last: 12 hours ago',
                category: "Security"
              }
            ].map((forum, index) => (
              <div key={index} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-cyan-400 font-semibold">{forum.title}</div>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                    {forum.category}
                  </span>
                </div>
                <div className="text-sm opacity-80">{forum.desc}</div>
              </div>
            ))}
          </div>
          <button className="nexus-action-btn">Join Discussions</button>
        </div>

        {/* Developer Collaboration Tools */}
        <div className="nexus-card">
          <h2>Collaboration Tools</h2>
          <p>Access developer-specific tools for project collaboration and knowledge sharing.</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 border border-cyan-500/20 p-4 rounded-lg text-center">
              <Code size={32} className="text-cyan-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Code Review Hub</h3>
              <p className="text-sm opacity-80 mb-3">Collaborative code review with AI assistance</p>
              <button className="nexus-action-btn w-full text-sm">Access Hub</button>
            </div>
            <div className="bg-white/5 border border-cyan-500/20 p-4 rounded-lg text-center">
              <Users size={32} className="text-green-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Pair Programming</h3>
              <p className="text-sm opacity-80 mb-3">Real-time collaborative coding sessions</p>
              <button className="nexus-action-btn w-full text-sm">Start Session</button>
            </div>
            <div className="bg-white/5 border border-cyan-500/20 p-4 rounded-lg text-center">
              <MessageSquare size={32} className="text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Tech Discussions</h3>
              <p className="text-sm opacity-80 mb-3">Deep technical conversations and Q&A</p>
              <button className="nexus-action-btn w-full text-sm">Join Chat</button>
            </div>
            <div className="bg-white/5 border border-cyan-500/20 p-4 rounded-lg text-center">
              <Trophy size={32} className="text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Coding Challenges</h3>
              <p className="text-sm opacity-80 mb-3">Daily challenges and competitions</p>
              <button className="nexus-action-btn w-full text-sm">View Challenges</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}