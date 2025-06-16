'use client';

import { PageType } from '@/app/page';
import { Users, Code, Trophy, MessageSquare, Calendar, Target, AlertCircle } from 'lucide-react';

interface CommunityPageProps {
  onPageChange: (page: PageType) => void;
}

export function CommunityPage({ onPageChange }: CommunityPageProps) {
  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Developer Community & Impact</h1>
        <p className="text-xl text-gray-300 mb-6">Connect with fellow developers, join events, and contribute to global technology goals</p>
        
        {/* Developer-Only Notice */}
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-purple-400" />
            <span className="font-medium text-purple-400">Developer Community Hub</span>
          </div>
          <p className="text-sm text-gray-300">
            This community space is exclusively for developers to network, collaborate, and participate in 
            technology-focused events and discussions. Login as a developer to join the conversation.
          </p>
        </div>
        
        <button 
          className="btn-secondary" 
          onClick={() => onPageChange('home')}
        >
          Back to Home
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Developer Events */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Developer Events & Hackathons</h2>
          <p className="text-gray-300 mb-4">Join global developer events to network and collaborate on cutting-edge projects.</p>
          
          <div className="max-h-[300px] overflow-y-auto mt-4">
            {[
              {
                title: "Advanced Computing Hackathon",
                desc: "Dec 15 | Online | Prize: 5,000 WORK",
                details: "Theme: Build algorithms for real-world problems. Teams of 3-5 developers.",
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
                desc: "Jan 5 | Online | Prize: 8,000 WORK",
                details: "Focus on smart contract security and DeFi protocol development.",
                type: "Summit"
              },
              {
                title: "AR/VR Developer Meetup",
                desc: "Jan 12 | Virtual Space | Free",
                details: "Monthly meetup for AR/VR developers to share projects and techniques.",
                type: "Meetup"
              }
            ].map((event, index) => (
              <div key={index} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-cyan-400 font-semibold">{event.title}</div>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                    {event.type}
                  </span>
                </div>
                <div className="text-sm mb-1">{event.desc}</div>
                <div className="text-xs opacity-80 mb-2">{event.details}</div>
                <button className="btn-secondary px-3 py-1 text-sm">RSVP Now</button>
              </div>
            ))}
          </div>
          <button className="btn-secondary w-full mt-4">View Full Calendar</button>
        </div>

        {/* Developer Impact Dashboard */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Developer Impact Metrics</h2>
          <p className="text-gray-300 mb-4">Track community-wide contributions to technology advancement and global development goals.</p>
          
          <div className="mt-4">
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Open Source Contributions</span>
                <span>85%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Knowledge Sharing</span>
                <span>72%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Mentorship Programs</span>
                <span>68%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
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
          <button className="btn-secondary w-full mt-4">Contribute to Impact</button>
        </div>

        {/* Developer Reputation & Rankings */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Developer Reputation System</h2>
          <p className="text-gray-300 mb-4">Build your reputation and see top contributors in the developer community.</p>
          
          <div className="max-h-[300px] overflow-y-auto mt-4">
            {[
              { name: "Alexandra Reed", specialty: "Advanced Computing", score: 9850 },
              { name: "Marcus Tan", specialty: "AR/VR Development", score: 9420 },
              { name: "Sofia Mendes", specialty: "Blockchain Security", score: 9180 },
              { name: "James Okoro", specialty: "AI/ML Engineering", score: 8950 },
              { name: "Li Wei Zhang", specialty: "DevOps & Cloud", score: 8720 },
              { name: "Elena Rivera", specialty: "Full Stack", score: 8500 }
            ].map((dev, index) => (
              <div key={index} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg flex justify-between items-center hover:bg-white/10 transition-all duration-300">
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
          <button className="btn-secondary w-full mt-4">View Full Rankings</button>
        </div>

        {/* Developer Forums & Discussions */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Developer Forums</h2>
          <p className="text-gray-300 mb-4">Discuss emerging technologies, share knowledge, and collaborate with fellow developers.</p>
          
          <div className="max-h-[300px] overflow-y-auto mt-4">
            {[
              {
                title: "Advanced Computing Discussion",
                desc: 'Topic: "Computing Advancements in 2024" | Posts: 89 | Last: 1 hour ago',
                category: "Computing"
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
                title: "AR/VR Innovation",
                desc: 'Topic: "WebXR Best Practices" | Posts: 43 | Last: 8 hours ago',
                category: "AR/VR"
              },
              {
                title: "Cybersecurity Hub",
                desc: 'Topic: "Zero-Trust Architecture" | Posts: 78 | Last: 12 hours ago',
                category: "Security"
              }
            ].map((forum, index) => (
              <div key={index} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg text-left hover:bg-white/10 transition-all duration-300">
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
          <button className="btn-secondary w-full mt-4">Join Discussions</button>
        </div>

        {/* Developer Collaboration Tools */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Collaboration Tools</h2>
          <p className="text-gray-300 mb-4">Access developer-specific tools for project collaboration and knowledge sharing.</p>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 border border-cyan-500/20 p-4 rounded-lg text-center hover:bg-white/10 transition-all duration-300">
              <Code size={32} className="text-cyan-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Code Review Hub</h3>
              <p className="text-sm opacity-80 mb-3">Collaborative code review with AI assistance</p>
              <button className="btn-secondary w-full text-sm">Access Hub</button>
            </div>
            <div className="bg-white/5 border border-cyan-500/20 p-4 rounded-lg text-center hover:bg-white/10 transition-all duration-300">
              <Users size={32} className="text-green-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Pair Programming</h3>
              <p className="text-sm opacity-80 mb-3">Real-time collaborative coding sessions</p>
              <button className="btn-secondary w-full text-sm">Start Session</button>
            </div>
            <div className="bg-white/5 border border-cyan-500/20 p-4 rounded-lg text-center hover:bg-white/10 transition-all duration-300">
              <MessageSquare size={32} className="text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Tech Discussions</h3>
              <p className="text-sm opacity-80 mb-3">Deep technical conversations and Q&A</p>
              <button className="btn-secondary w-full text-sm">Join Chat</button>
            </div>
            <div className="bg-white/5 border border-cyan-500/20 p-4 rounded-lg text-center hover:bg-white/10 transition-all duration-300">
              <Trophy size={32} className="text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Coding Challenges</h3>
              <p className="text-sm opacity-80 mb-3">Daily challenges and competitions</p>
              <button className="btn-secondary w-full text-sm">View Challenges</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}