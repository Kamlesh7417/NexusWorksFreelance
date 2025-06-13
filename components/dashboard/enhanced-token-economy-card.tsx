'use client';

import { useState, useEffect } from 'react';
import { WalletConnector } from '@/components/blockchain/wallet-connector';
import { TokenStaking } from '@/components/blockchain/token-staking';
import { ProjectEscrow } from '@/components/blockchain/project-escrow';
import { TransactionHistory } from '@/components/blockchain/transaction-history';
import { PriceFeedService } from '@/lib/blockchain';
import { TrendingUp, DollarSign, Zap, Shield } from 'lucide-react';

export function EnhancedTokenEconomyCard() {
  const [activeTab, setActiveTab] = useState<'wallet' | 'staking' | 'escrow' | 'history'>('wallet');
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  useEffect(() => {
    loadTokenPrice();
    const interval = setInterval(loadTokenPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTokenPrice = async () => {
    const price = await PriceFeedService.getWorkTokenPrice();
    const history = PriceFeedService.getPriceHistory();
    
    if (history.length >= 2) {
      const current = history[history.length - 1].price;
      const previous = history[history.length - 2].price;
      const change = ((current - previous) / previous) * 100;
      setPriceChange(change);
    }
    
    setTokenPrice(price);
  };

  const tabs = [
    { id: 'wallet', label: 'Wallet', icon: Zap },
    { id: 'staking', label: 'Staking', icon: TrendingUp },
    { id: 'escrow', label: 'Escrow', icon: Shield },
    { id: 'history', label: 'History', icon: DollarSign },
  ];

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Quantum Token Economy</h2>
          <p className="text-sm opacity-80">Blockchain-powered WORK token ecosystem</p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">WORK Token</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-400">
              ${tokenPrice.toFixed(4)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
        {tabs.map(tab => {
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

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'wallet' && <WalletConnector />}
        {activeTab === 'staking' && <TokenStaking />}
        {activeTab === 'escrow' && <ProjectEscrow />}
        {activeTab === 'history' && <TransactionHistory />}
      </div>

      {/* Quantum Encryption Status */}
      <div className="mt-6 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-purple-400">Quantum Blockchain Security</span>
        </div>
        <div className="text-xs text-gray-400">
          Your WORK tokens are secured with quantum-resistant encryption and smart contract automation
        </div>
      </div>
    </div>
  );
}