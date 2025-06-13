'use client';

import { useState } from 'react';

export function TokenEconomyCard() {
  const [tokenBalance, setTokenBalance] = useState(1250);
  const [stakeAmount, setStakeAmount] = useState('');

  const stakeTokens = () => {
    const amount = parseInt(stakeAmount);
    if (amount && amount <= tokenBalance) {
      setTokenBalance(prev => prev - amount);
      setStakeAmount('');
      alert(`Successfully staked ${amount} WORK tokens!`);
    }
  };

  return (
    <div className="nexus-card">
      <h2>Token Economy</h2>
      <div className="bg-cyan-500/10 border border-cyan-500/30 text-white px-4 py-2 rounded-full text-sm text-center mb-4">
        WORK Token Balance: <span>{tokenBalance}</span>
      </div>
      <p>Earn and stake WORK tokens for rewards.</p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-black/30 border border-cyan-500/30 rounded-lg p-4 text-center">
          <h3>Standard Staking</h3>
          <div className="text-cyan-400 text-xl my-2">5% APR</div>
          <input 
            type="number" 
            className="w-full bg-white/10 border border-cyan-500/30 rounded-full px-3 py-2 text-white text-center mb-2"
            placeholder="Amount to stake"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            min="0"
            max={tokenBalance}
          />
          <button className="nexus-action-btn w-full py-1" onClick={stakeTokens}>
            Stake Now
          </button>
        </div>
        <div className="bg-black/30 border border-cyan-500/30 rounded-lg p-4 text-center">
          <h3>Impact Staking</h3>
          <div className="text-cyan-400 text-xl my-2">8% APR</div>
          <p className="text-sm mb-2">Supports SDG projects</p>
          <button className="nexus-action-btn w-full py-1">
            Learn More
          </button>
        </div>
      </div>
      <button className="nexus-action-btn">Manage Tokens</button>
    </div>
  );
}