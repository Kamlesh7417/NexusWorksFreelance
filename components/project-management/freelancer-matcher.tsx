'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectManager, FreelancerProfile, ProjectMatch } from '@/lib/project-management';
import { Star, MapPin, Clock, DollarSign, Zap, Users } from 'lucide-react';

interface FreelancerMatcherProps {
  project: Project;
}

export function FreelancerMatcher({ project }: FreelancerMatcherProps) {
  const [matches, setMatches] = useState<ProjectMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<FreelancerProfile | null>(null);

  // Mock freelancer data - in production this would come from a database
  const mockFreelancers: FreelancerProfile[] = [
    {
      id: 'fl_001',
      name: 'Alexandra Reed',
      email: 'alexandra@example.com',
      skills: ['React', 'Node.js', 'TypeScript', 'AI/ML', 'Quantum Computing'],
      hourlyRate: 85,
      availability: 'available',
      rating: 4.9,
      completedProjects: 32,
      specializations: ['Full Stack Development', 'AI Integration'],
      location: 'San Francisco, CA',
      timezone: 'PST'
    },
    {
      id: 'fl_002',
      name: 'Marcus Tan',
      email: 'marcus@example.com',
      skills: ['UI/UX Design', 'React', 'Figma', 'AR/VR', 'Prototyping'],
      hourlyRate: 75,
      availability: 'available',
      rating: 4.7,
      completedProjects: 28,
      specializations: ['Product Design', 'User Experience'],
      location: 'Singapore',
      timezone: 'SGT'
    },
    {
      id: 'fl_003',
      name: 'Sofia Mendes',
      email: 'sofia@example.com',
      skills: ['Python', 'Data Science', 'Machine Learning', 'TensorFlow', 'PyTorch'],
      hourlyRate: 90,
      availability: 'busy',
      rating: 5.0,
      completedProjects: 45,
      specializations: ['Data Science', 'AI/ML Engineering'],
      location: 'São Paulo, Brazil',
      timezone: 'BRT'
    },
    {
      id: 'fl_004',
      name: 'James Okoro',
      email: 'james@example.com',
      skills: ['Cybersecurity', 'Blockchain', 'Solidity', 'Encryption', 'Penetration Testing'],
      hourlyRate: 95,
      availability: 'available',
      rating: 4.8,
      completedProjects: 38,
      specializations: ['Blockchain Security', 'Smart Contracts'],
      location: 'Lagos, Nigeria',
      timezone: 'WAT'
    },
    {
      id: 'fl_005',
      name: 'Li Wei Zhang',
      email: 'liwei@example.com',
      skills: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
      hourlyRate: 80,
      availability: 'available',
      rating: 4.6,
      completedProjects: 41,
      specializations: ['Cloud Infrastructure', 'DevOps Engineering'],
      location: 'Beijing, China',
      timezone: 'CST'
    }
  ];

  useEffect(() => {
    findMatches();
  }, [project]);

  const findMatches = async () => {
    setIsMatching(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const projectMatches = await ProjectManager.matchFreelancers(project, mockFreelancers);
      setMatches(projectMatches);
    } catch (error) {
      console.error('Matching error:', error);
    } finally {
      setIsMatching(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-400 bg-green-500/20';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20';
      case 'unavailable': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const estimateProjectCost = (freelancer: FreelancerProfile) => {
    const totalHours = project.tasks.reduce((sum, task) => sum + task.timeTracking.estimated, 0);
    return freelancer.hourlyRate * totalHours;
  };

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Quantum Freelancer Matcher</h2>
          <p className="text-sm opacity-80">AI-powered talent matching for your project</p>
        </div>
        <button 
          onClick={findMatches}
          disabled={isMatching}
          className="nexus-action-btn flex items-center gap-2"
        >
          {isMatching ? (
            <>
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              Quantum Matching...
            </>
          ) : (
            <>
              <Zap size={16} />
              Refresh Matches
            </>
          )}
        </button>
      </div>

      {isMatching ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-cyan-400">Analyzing quantum compatibility matrices...</p>
            <p className="text-sm opacity-70 mt-2">Matching skills, availability, and project requirements</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.length > 0 ? (
            <>
              <div className="text-sm text-cyan-400 mb-4">
                Found {matches.length} compatible freelancers for your project
              </div>
              
              {matches.map((match, index) => (
                <div 
                  key={match.freelancer.id}
                  className="bg-white/5 rounded-lg p-6 border border-cyan-500/20 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => setSelectedFreelancer(match.freelancer)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-cyan-400 text-lg">{match.freelancer.name}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-gray-400">{match.freelancer.location}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getAvailabilityColor(match.freelancer.availability)}`}>
                            {match.freelancer.availability}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={16} className={getMatchColor(match.score)} />
                        <span className={`font-bold text-lg ${getMatchColor(match.score)}`}>
                          {match.score}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">Match Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={14} className="text-yellow-400" />
                        <span className="text-sm">Rating</span>
                      </div>
                      <div className="font-semibold text-yellow-400">
                        {match.freelancer.rating}/5.0
                      </div>
                      <div className="text-xs text-gray-400">
                        {match.freelancer.completedProjects} projects
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={14} className="text-green-400" />
                        <span className="text-sm">Rate</span>
                      </div>
                      <div className="font-semibold text-green-400">
                        ${match.freelancer.hourlyRate}/hr
                      </div>
                      <div className="text-xs text-gray-400">
                        Est: ${estimateProjectCost(match.freelancer).toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-purple-400" />
                        <span className="text-sm">Skills</span>
                      </div>
                      <div className="font-semibold text-purple-400">
                        {match.skillMatch}%
                      </div>
                      <div className="text-xs text-gray-400">
                        {match.freelancer.skills.length} skills
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-cyan-400 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {match.freelancer.skills.slice(0, 6).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-400"
                        >
                          {skill}
                        </span>
                      ))}
                      {match.freelancer.skills.length > 6 && (
                        <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs text-gray-400">
                          +{match.freelancer.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-cyan-400 mb-2">Match Analysis</h4>
                    <p className="text-sm opacity-80">{match.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Skill Match</div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                          style={{ width: `${match.skillMatch}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-cyan-400 mt-1">{match.skillMatch}%</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Availability</div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                          style={{ width: `${match.availabilityMatch}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-green-400 mt-1">{match.availabilityMatch}%</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Budget</div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                          style={{ width: `${match.budgetMatch}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-yellow-400 mt-1">{match.budgetMatch}%</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Location</div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full"
                          style={{ width: `${match.locationMatch}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-purple-400 mt-1">{match.locationMatch}%</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="nexus-action-btn flex-1">
                      View Profile
                    </button>
                    <button className="nexus-action-btn flex-1">
                      Send Invitation
                    </button>
                    <button className="nexus-action-btn">
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No freelancer matches found</p>
              <p className="text-sm">Try adjusting your project requirements or budget</p>
            </div>
          )}
        </div>
      )}

      {/* Freelancer Detail Modal */}
      {selectedFreelancer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-8 max-w-2xl w-[90%] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">{selectedFreelancer.name}</h2>
              <button 
                onClick={() => setSelectedFreelancer(null)}
                className="nexus-back-btn"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-cyan-400 font-medium mb-2">Contact</h4>
                  <p className="text-sm">{selectedFreelancer.email}</p>
                  <p className="text-sm text-gray-400">{selectedFreelancer.location}</p>
                  <p className="text-sm text-gray-400">{selectedFreelancer.timezone}</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-cyan-400 font-medium mb-2">Stats</h4>
                  <p className="text-sm">Rating: {selectedFreelancer.rating}/5.0</p>
                  <p className="text-sm">Projects: {selectedFreelancer.completedProjects}</p>
                  <p className="text-sm">Rate: ${selectedFreelancer.hourlyRate}/hr</p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-cyan-400 font-medium mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFreelancer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm text-cyan-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-cyan-400 font-medium mb-3">Specializations</h4>
                <div className="space-y-2">
                  {selectedFreelancer.specializations.map((spec, index) => (
                    <div key={index} className="text-sm">• {spec}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}