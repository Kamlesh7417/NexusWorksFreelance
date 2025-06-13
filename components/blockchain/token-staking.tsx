'use client';

import { useState, useEffect } from 'react';
import { blockchainService, StakingInfo, PriceFeedService } from '@/lib/blockchain';
import { Zap, TrendingUp, Clock, DollarSign, Plus, Minus } from 'lucide-react';

export function TokenStaking() {
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    loadStakingInfo();
    loadTokenPrice();
    
    // Update price every 30 seconds
    const priceInterval = setInterval(loadTokenPrice, 30000);
    
    // Update staking info every 10 seconds
    const stakingInterval = setInterval(loadStakingInfo, 10000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(stakingInterval);
    };
  }, []);

  const loadStakingInfo = async () => {
    const info = await blockchainService.getStakingInfo();
    setStakingInfo(info);
  };

  const loadTokenPrice = async () => {
    const price = await PriceFeedService.getWorkTokenPrice();
    setTokenPrice(price);
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;

    setIsStaking(true);
    try {
      const success = await blockchainService.stakeTokens(stakeAmount);
      if (success) {
        setStakeAmount('');
        await loadStakingInfo();
      }
    } catch (error) {
      console.error('Staking error:', error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;

    setIsUnstaking(true);
    try {
      const success = await blockchainService.unstakeTokens(unstakeAmount);
      if (success) {
        setUnstakeAmount('');
        await loadStakingInfo();
      }
    } catch (error) {
      console.error('Unstaking error:', error);
    } finally {
      setIsUnstaking(false);
    }
  };

  const handleClaimRewards = async () => {
    setIsClaiming(true);
    try {
      const success = await blockchainService.claimRewards();
      if (success) {
        await loadStakingInfo();
      }
    } catch (error) {
      console.error('Claim rewards error:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const calculateUSDValue = (workAmount: string) => {
    return (parseFloat(workAmount) * tokenPrice).toFixed(2);
  };

  const formatStakingTime = (timestamp: number) => {
    if (!timestamp) return 'Not staking';
    
    const now = Date.now() / 1000;
    const duration = now - timestamp;
    const days = Math.floor(duration / 86400);
    const hours = Math.floor((duration % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (!stakingInfo) {
    return (
      <div className="nexus-card">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Quantum Staking Protocol</h2>
          <p className="text-sm opacity-80">Earn rewards through neural consensus mechanisms</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">WORK Price</div>
          <div className="font-bold text-green-400">${tokenPrice.toFixed(4)}</div>
        </div>
      </div>

      {/* Staking Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-cyan-400" />
            <span className="text-sm">Staked Amount</span>
          </div>
          <div className="text-xl font-bold text-cyan-400">
            {parseFloat(stakingInfo.stakedAmount).toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            ${calculateUSDValue(stakingInfo.stakedAmount)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-sm">Pending Rewards</span>
          </div>
          <div className="text-xl font-bold text-green-400">
            {parseFloat(stakingInfo.pendingRewards).toFixed(4)}
          </div>
          <div className="text-xs text-gray-400">
            ${calculateUSDValue(stakingInfo.pendingRewards)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-yellow-400" />
            <span className="text-sm">Total Rewards</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">
            {parseFloat(stakingInfo.totalRewards).toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            ${calculateUSDValue(stakingInfo.totalRewards)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-purple-400" />
            <span className="text-sm">Staking Time</span>
          </div>
          <div className="text-xl font-bold text-purple-400">
            {formatStakingTime(stakingInfo.stakingTime)}
          </div>
          <div className="text-xs text-gray-400">
            APY: {stakingInfo.apy}%
          </div>
        </div>
      </div>

      {/* APY Display */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 mb-6 border border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-green-400 mb-1">Current APY</h4>
            <p className="text-sm opacity-80">Quantum-enhanced yield optimization</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">{stakingInfo.apy}%</div>
            <div className="text-xs text-gray-400">Annual Percentage Yield</div>
          </div>
        </div>
      </div>

      {/* Staking Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Stake Tokens */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            <Plus size={16} />
            Stake WORK Tokens
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount to Stake</label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
              />
              <div className="text-xs text-gray-400 mt-1">
                ≈ ${calculateUSDValue(stakeAmount || '0')} USD
              </div>
            </div>
            
            <button
              onClick={handleStake}
              disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className="nexus-action-btn w-full flex items-center justify-center gap-2"
            >
              {isStaking ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  Staking...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Stake Tokens
                </>
              )}
            </button>
          </div>
        </div>

        {/* Unstake Tokens */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
            <Minus size={16} />
            Unstake WORK Tokens
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount to Unstake</label>
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="0.00"
                max={stakingInfo.stakedAmount}
                className="w-full bg-white/10 border border-orange-500/30 rounded-lg px-3 py-2 text-white outline-none"
              />
              <div className="text-xs text-gray-400 mt-1">
                Max: {parseFloat(stakingInfo.stakedAmount).toFixed(2)} WORK
              </div>
            </div>
            
            <button
              onClick={handleUnstake}
              disabled={isUnstaking || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
              className="nexus-action-btn w-full flex items-center justify-center gap-2 !border-orange-500/40 !text-orange-400 hover:!bg-orange-500/20"
            >
              {isUnstaking ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                  Unstaking...
                </>
              ) : (
                <>
                  <Minus size={16} />
                  Unstake Tokens
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Claim Rewards */}
      {parseFloat(stakingInfo.pendingRewards) > 0 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-purple-400 mb-1">Rewards Available</h4>
              <p className="text-sm opacity-80">
                {parseFloat(stakingInfo.pendingRewards).toFixed(4)} WORK tokens ready to claim
              </p>
            </div>
            <button
              onClick={handleClaimRewards}
              disabled={isClaiming}
              className="nexus-action-btn flex items-center gap-2 !border-purple-500/40 !text-purple-400 hover:!bg-purple-500/20"
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  Claiming...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Claim Rewards
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quantum Encryption Status */}
      <div className="mt-6 p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-400">Quantum Staking Protocol Active</span>
        </div>
        <div className="text-xs text-gray-400">
          Your staked tokens are secured with quantum-resistant algorithms and earn rewards through neural consensus
        </div>
      </div>
    </div>
  );
}