'use client';

import { useState } from 'react';

export function ReputationVotingCard() {
  const [votes, setVotes] = useState<Record<string, number>>({
    'Alexandra Reed': 156,
    'Marcus Tan': 143,
    'Sofia Mendes': 189,
    'James Okoro': 134,
    'Li Wei Zhang': 167
  });

  const castVote = (name: string) => {
    setVotes(prev => ({
      ...prev,
      [name]: prev[name] + 1
    }));
    alert(`Voted for ${name}! New total: ${votes[name] + 1} votes`);
  };

  return (
    <div className="nexus-card">
      <h2>Reputation Voting</h2>
      <p>Community-driven scores via blockchain.</p>
      <div className="max-h-[300px] overflow-y-auto mt-4">
        {Object.entries(votes).map(([name, voteCount]) => (
          <div key={name} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg flex justify-between items-center">
            <div>
              <span className="font-semibold">{name}</span>
              <div className="text-xs text-gray-400">{voteCount} votes</div>
            </div>
            <button 
              className="bg-cyan-500/20 border border-cyan-500/40 text-white px-3 py-1 rounded-md text-sm hover:bg-cyan-500/40 transition-all"
              onClick={() => castVote(name)}
            >
              Vote +1
            </button>
          </div>
        ))}
      </div>
      <button className="nexus-action-btn">View Rankings</button>
    </div>
  );
}