'use client';

import { useState, useEffect } from 'react';

export function SecurityCard() {
  const [threatsBlocked, setThreatsBlocked] = useState(23);

  useEffect(() => {
    const interval = setInterval(() => {
      setThreatsBlocked(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="nexus-card">
      <h2>Security & Compliance</h2>
      <p>Quantum encryption for unbreakable security.</p>
      <div className="w-full h-[180px] bg-gradient-to-br from-blue-900 to-blue-600 mt-4 rounded-lg relative overflow-hidden flex flex-col shadow-lg shadow-blue-600/50">
        <div className="bg-cyan-500/20 p-2 text-center text-sm border-b border-cyan-500/30">
          Quantum Encryption Status
        </div>
        <div className="flex-1 p-4 grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-xs">Security Level</div>
            <div className="text-cyan-400 text-xl">100%</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-xs">Key Strength</div>
            <div className="text-cyan-400 text-xl">4096 Qubits</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-xs">Threats Blocked</div>
            <div className="text-cyan-400 text-xl">{threatsBlocked}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-xs">Data Integrity</div>
            <div className="text-cyan-400 text-xl">Verified</div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-5 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse"></div>
      </div>
      <button className="nexus-action-btn">View Details</button>
    </div>
  );
}