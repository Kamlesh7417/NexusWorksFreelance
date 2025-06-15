'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  Eye, 
  Star,
  Tag
} from 'lucide-react';

interface ProjectCardProps {
  project: any;
  showMatchScore?: boolean;
  matchScore?: number;
}

export function ProjectCard({ project, showMatchScore = false, matchScore }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-purple-400 bg-purple-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div 
      className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1">{project.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 capitalize">{project.category.replace('-', ' ')}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(project.urgency)}`}>
              {project.urgency}
            </span>
          </div>
        </div>
        
        {showMatchScore && matchScore !== undefined && (
          <div className={`font-semibold ${getMatchColor(matchScore)}`}>
            {matchScore}% match
          </div>
        )}
      </div>
      
      <p className="text-gray-300 text-sm mb-4 line-clamp-3">{project.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {project.skills_required && project.skills_required.slice(0, 3).map((skill: string, index: number) => (
          <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-400">
            {skill}
          </span>
        ))}
        {project.skills_required && project.skills_required.length > 3 && (
          <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs text-gray-400">
            +{project.skills_required.length - 3} more
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-green-400" />
          <span className="text-green-400 font-semibold">
            ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
          </span>
        </div>
        
        {project.deadline && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-yellow-400" />
            <span className="text-gray-300">
              {new Date(project.deadline).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      
      <Link 
        href={`/projects/${project.id}`}
        className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Eye size={16} />
        View Details
      </Link>
    </div>
  );
}