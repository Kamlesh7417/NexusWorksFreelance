'use client';

import { useState, useEffect } from 'react';
import { Video, Users, Clock, Star, DollarSign, Eye, MessageCircle, Share2 } from 'lucide-react';

interface ShadowingSession {
  id: string;
  mentorName: string;
  mentorRating: number;
  title: string;
  description: string;
  technology: string[];
  duration: number;
  earnings: number;
  participants: number;
  maxParticipants: number;
  startTime: string;
  status: 'upcoming' | 'live' | 'completed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface Mentor {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  specialties: string[];
  experience: string;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'offline';
  totalSessions: number;
}

export function ShadowingSystem() {
  const [sessions, setSessions] = useState<ShadowingSession[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedSession, setSelectedSession] = useState<ShadowingSession | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'mentors' | 'live'>('sessions');
  const [isInSession, setIsInSession] = useState(false);

  const mockSessions: ShadowingSession[] = [
    {
      id: 'session-1',
      mentorName: 'Dr. Alexandra Quantum',
      mentorRating: 4.9,
      title: 'Building Quantum Algorithms in Real-Time',
      description: 'Watch as I develop quantum algorithms for optimization problems, including live debugging and testing',
      technology: ['Qiskit', 'Python', 'Quantum Computing'],
      duration: 120,
      earnings: 50,
      participants: 8,
      maxParticipants: 12,
      startTime: '2024-01-15T14:00:00Z',
      status: 'upcoming',
      difficulty: 'advanced'
    },
    {
      id: 'session-2',
      mentorName: 'Prof. Marcus Neural',
      mentorRating: 4.8,
      title: 'Live AI Model Training Session',
      description: 'Join me as I train a transformer model from scratch, covering data preprocessing to deployment',
      technology: ['TensorFlow', 'Python', 'Machine Learning'],
      duration: 180,
      earnings: 75,
      participants: 15,
      maxParticipants: 20,
      startTime: '2024-01-15T16:00:00Z',
      status: 'live',
      difficulty: 'intermediate'
    },
    {
      id: 'session-3',
      mentorName: 'Sofia Blockchain',
      mentorRating: 4.7,
      title: 'Smart Contract Development Workshop',
      description: 'Real-world DeFi protocol development with security best practices and gas optimization',
      technology: ['Solidity', 'Web3', 'Ethereum'],
      duration: 150,
      earnings: 60,
      participants: 10,
      maxParticipants: 15,
      startTime: '2024-01-15T18:00:00Z',
      status: 'upcoming',
      difficulty: 'intermediate'
    }
  ];

  const mockMentors: Mentor[] = [
    {
      id: 'mentor-1',
      name: 'Dr. Alexandra Quantum',
      avatar: '/api/placeholder/64/64',
      rating: 4.9,
      specialties: ['Quantum Computing', 'Algorithm Design', 'Research'],
      experience: '10+ years in quantum research',
      hourlyRate: 150,
      availability: 'available',
      totalSessions: 234
    },
    {
      id: 'mentor-2',
      name: 'Prof. Marcus Neural',
      avatar: '/api/placeholder/64/64',
      rating: 4.8,
      specialties: ['AI/ML', 'Deep Learning', 'Computer Vision'],
      experience: '8+ years in AI development',
      hourlyRate: 120,
      availability: 'busy',
      totalSessions: 189
    },
    {
      id: 'mentor-3',
      name: 'Sofia Blockchain',
      avatar: '/api/placeholder/64/64',
      rating: 4.7,
      specialties: ['Blockchain', 'Smart Contracts', 'DeFi'],
      experience: '6+ years in blockchain',
      hourlyRate: 100,
      availability: 'available',
      totalSessions: 156
    }
  ];

  useEffect(() => {
    setSessions(mockSessions);
    setMentors(mockMentors);
  }, []);

  const joinSession = (session: ShadowingSession) => {
    setSelectedSession(session);
    setIsInSession(true);
  };

  const leaveSession = () => {
    setIsInSession(false);
    setSelectedSession(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-red-400 bg-red-500/20';
      case 'upcoming': return 'text-yellow-400 bg-yellow-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-400 bg-green-500/20';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20';
      case 'offline': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isInSession && selectedSession) {
    return (
      <div className="nexus-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Live Shadowing Session</h2>
            <p className="text-sm opacity-80">{selectedSession.title}</p>
          </div>
          <button onClick={leaveSession} className="nexus-back-btn">
            Leave Session
          </button>
        </div>

        {/* Live Session Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Feed */}
          <div className="lg:col-span-3">
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              <div className="relative">
                <div className="w-full h-64 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Live Screen Share</h3>
                    <p className="opacity-80">Mentor: {selectedSession.mentorName}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">LIVE</span>
                    </div>
                  </div>
                </div>
                
                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="text-white hover:text-cyan-400">
                        <Video size={20} />
                      </button>
                      <button className="text-white hover:text-cyan-400">
                        <MessageCircle size={20} />
                      </button>
                      <button className="text-white hover:text-cyan-400">
                        <Share2 size={20} />
                      </button>
                    </div>
                    
                    <div className="text-white text-sm">
                      {selectedSession.participants} participants watching
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold text-cyan-400 mb-2">What You're Learning</h3>
              <p className="text-sm opacity-80 mb-3">{selectedSession.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {selectedSession.technology.map((tech, index) => (
                  <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Chat & Participants */}
          <div className="space-y-4">
            {/* Live Chat */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-cyan-400 mb-3">Live Chat</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
                <div className="bg-white/5 rounded p-2">
                  <span className="text-cyan-400 font-medium">Student1:</span>
                  <span className="ml-2">Great explanation of quantum gates!</span>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <span className="text-green-400 font-medium">Mentor:</span>
                  <span className="ml-2">Thanks! Any questions about superposition?</span>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <span className="text-cyan-400 font-medium">Student2:</span>
                  <span className="ml-2">How do you handle decoherence in practice?</span>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  className="flex-1 bg-white/10 border border-cyan-500/30 rounded px-2 py-1 text-sm outline-none"
                />
                <button className="nexus-action-btn text-sm px-3 py-1">Send</button>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-cyan-400 mb-3">
                Participants ({selectedSession.participants})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Array.from({ length: Math.min(selectedSession.participants, 8) }, (_, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <Users size={12} />
                    </div>
                    <span>Student{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings Tracker */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-500/30">
              <h4 className="font-semibold text-green-400 mb-2">Session Earnings</h4>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {selectedSession.earnings} WORK
              </div>
              <div className="text-xs text-gray-400">
                Earned for {selectedSession.duration} minutes
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Neural Shadowing System</h2>
          <p className="text-sm opacity-80">Learn by watching experts work in real-time</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
        {[
          { id: 'sessions', label: 'Live Sessions', icon: Video },
          { id: 'mentors', label: 'Mentors', icon: Users },
          { id: 'live', label: 'Currently Live', icon: Eye },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.map(session => (
            <div key={session.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-cyan-400">{session.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(session.difficulty)}`}>
                      {session.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-sm opacity-80 mb-2">{session.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{session.mentorName}</span>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400" />
                        <span>{session.mentorRating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{session.duration}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{session.earnings} WORK</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-2">
                    {formatTime(session.startTime)}
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    {session.participants}/{session.maxParticipants} participants
                  </div>
                  <button
                    onClick={() => joinSession(session)}
                    disabled={session.status === 'completed'}
                    className={`nexus-action-btn text-sm px-4 py-1 ${
                      session.status === 'live' ? '!border-red-500/40 !text-red-400 hover:!bg-red-500/20' : ''
                    }`}
                  >
                    {session.status === 'live' ? 'Join Live' : 'Join Session'}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {session.technology.map((tech, index) => (
                  <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mentors Tab */}
      {activeTab === 'mentors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentors.map(mentor => (
            <div key={mentor.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <Users size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-cyan-400">{mentor.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" />
                      <span>{mentor.rating}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getAvailabilityColor(mentor.availability)}`}>
                      {mentor.availability}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm opacity-80 mb-3">{mentor.experience}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {mentor.specialties.map((specialty, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs">
                    {specialty}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-gray-400">Rate: ${mentor.hourlyRate}/hr</div>
                  <div className="text-gray-400">{mentor.totalSessions} sessions</div>
                </div>
                <button className="nexus-action-btn text-sm px-4 py-1">
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Currently Live Tab */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {sessions.filter(s => s.status === 'live').map(session => (
            <div key={session.id} className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-semibold">LIVE NOW</span>
              </div>
              
              <h3 className="font-semibold text-cyan-400 mb-2">{session.title}</h3>
              <p className="text-sm opacity-80 mb-3">{session.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span>{session.mentorName}</span>
                  <span>{session.participants} watching</span>
                  <span>{session.earnings} WORK earned</span>
                </div>
                <button
                  onClick={() => joinSession(session)}
                  className="nexus-action-btn !border-red-500/40 !text-red-400 hover:!bg-red-500/20"
                >
                  Join Live Session
                </button>
              </div>
            </div>
          ))}
          
          {sessions.filter(s => s.status === 'live').length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Eye size={48} className="mx-auto mb-4 opacity-50" />
              <p>No live sessions at the moment</p>
              <p className="text-sm">Check back soon for live mentoring sessions</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}