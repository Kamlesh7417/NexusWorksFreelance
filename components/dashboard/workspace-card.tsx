'use client';

import { useState } from 'react';

export function WorkspaceCard() {
  const [activeLayer, setActiveLayer] = useState('base');

  const toggleARLayer = (layer: string) => {
    setActiveLayer(layer);
  };

  return (
    <div className="nexus-card">
      <h2>Virtual Workspace</h2>
      <p>Collaborate with photorealistic avatars and holographic tools.</p>
      <div className="w-full h-[180px] bg-gradient-to-r from-green-500 to-emerald-400 mt-4 rounded-lg relative transform rotate-x-10 shadow-lg shadow-green-500/50 flex items-center justify-center">
        <div 
          className={`absolute w-4/5 h-4/5 bg-white/10 border border-dashed border-white/30 rounded-lg flex items-center justify-center text-sm text-center transition-opacity duration-500 ${
            activeLayer === 'base' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Base Environment<br />[Physical Space]
        </div>
        <div 
          className={`absolute w-4/5 h-4/5 bg-white/10 border border-dashed border-white/30 rounded-lg flex items-center justify-center text-sm text-center transition-opacity duration-500 ${
            activeLayer === 'project' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Project Overlay<br />[AI Dashboard Design]
        </div>
        <div 
          className={`absolute w-4/5 h-4/5 bg-white/10 border border-dashed border-white/30 rounded-lg flex items-center justify-center text-sm text-center transition-opacity duration-500 ${
            activeLayer === 'annotation' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Annotations<br />[Team Notes]
        </div>
        <div className="nexus-project-controls">
          <button 
            className={`nexus-project-btn ${activeLayer === 'base' ? 'bg-cyan-500/30' : ''}`}
            onClick={() => toggleARLayer('base')}
          >
            Base
          </button>
          <button 
            className={`nexus-project-btn ${activeLayer === 'project' ? 'bg-cyan-500/30' : ''}`}
            onClick={() => toggleARLayer('project')}
          >
            Project
          </button>
          <button 
            className={`nexus-project-btn ${activeLayer === 'annotation' ? 'bg-cyan-500/30' : ''}`}
            onClick={() => toggleARLayer('annotation')}
          >
            Annotations
          </button>
        </div>
      </div>
      <button className="nexus-action-btn">Join Workspace</button>
    </div>
  );
}