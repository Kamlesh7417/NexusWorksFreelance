'use client';

import { useState, useEffect } from 'react';

export function MarketplaceCard() {
  const [matchmakingStatus, setMatchmakingStatus] = useState('Searching for Matches...');
  const [timer, setTimer] = useState(30);
  const [isMatching, setIsMatching] = useState(false);

  const startMatchmaking = () => {
    setIsMatching(true);
    setMatchmakingStatus('Searching for Matches...');
    setTimer(30);
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setMatchmakingStatus('3 Matches Found!');
          setIsMatching(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="nexus-card">
      <h2>Global Talent Marketplace</h2>
      <p>Quantum AI matches you with projects in real-time. Find your next gig instantly.</p>
      <ul>
        <li>Success Rate Prediction: 94%</li>
        <li>Active Projects: 127</li>
        <li>Freelancers Online: 3,452</li>
      </ul>
      <div className="w-full h-[200px] bg-gradient-to-r from-red-500 to-orange-500 mt-4 rounded-lg relative overflow-hidden flex flex-col items-center justify-center shadow-lg shadow-red-500/50">
        <div className="bg-white/10 p-2 w-full text-center text-sm">
          Real-Time Matchmaking
        </div>
        <div className={`text-green-400 text-xl my-4 ${isMatching ? 'animate-pulse' : ''}`}>
          {matchmakingStatus}
        </div>
        <div className="text-yellow-400 text-2xl">
          {formatTime(timer)}
        </div>
      </div>
      <button className="nexus-action-btn" onClick={startMatchmaking}>
        Find Matches Now
      </button>
      <button className="nexus-action-btn ml-2">
        Browse All Projects
      </button>
    </div>
  );
}