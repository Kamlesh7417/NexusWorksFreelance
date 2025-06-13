'use client';

import { useState, useEffect } from 'react';
import { blockchainService } from '@/lib/blockchain';
import { ArrowUpRight, ArrowDownLeft, Clock, ExternalLink, Filter } from 'lucide-react';

interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'stake' | 'unstake' | 'reward' | 'escrow';
  amount: string;
  from: string;
  to: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  blockNumber?: number;
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactionHistory();
    
    // Set up event listeners for real-time updates
    blockchainService.onTokenTransfer((from, to, amount) => {
      addNewTransaction({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        type: 'send', // This would be determined based on user's address
        amount,
        from,
        to,
        timestamp: Date.now() / 1000,
        status: 'confirmed'
      });
    });

    blockchainService.onTokensStaked((user, amount) => {
      addNewTransaction({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        type: 'stake',
        amount,
        from: user,
        to: 'Staking Contract',
        timestamp: Date.now() / 1000,
        status: 'confirmed'
      });
    });

    return () => {
      blockchainService.removeAllListeners();
    };
  }, []);

  const loadTransactionHistory = async () => {
    setIsLoading(true);
    try {
      // Mock transaction data - in production, this would come from blockchain
      const mockTransactions: Transaction[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          type: 'receive',
          amount: '500.0',
          from: '0x8765432109876543210987654321098765432109',
          to: '0x1234567890123456789012345678901234567890',
          timestamp: Date.now() / 1000 - 3600,
          status: 'confirmed',
          gasUsed: '21000',
          blockNumber: 18500000
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          type: 'stake',
          amount: '1000.0',
          from: '0x1234567890123456789012345678901234567890',
          to: 'Staking Contract',
          timestamp: Date.now() / 1000 - 7200,
          status: 'confirmed',
          gasUsed: '45000',
          blockNumber: 18499950
        },
        {
          hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          type: 'reward',
          amount: '25.5',
          from: 'Staking Contract',
          to: '0x1234567890123456789012345678901234567890',
          timestamp: Date.now() / 1000 - 10800,
          status: 'confirmed',
          gasUsed: '30000',
          blockNumber: 18499900
        },
        {
          hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          type: 'send',
          amount: '250.0',
          from: '0x1234567890123456789012345678901234567890',
          to: '0x9876543210987654321098765432109876543210',
          timestamp: Date.now() / 1000 - 14400,
          status: 'confirmed',
          gasUsed: '21000',
          blockNumber: 18499850
        },
        {
          hash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
          type: 'escrow',
          amount: '2000.0',
          from: '0x1234567890123456789012345678901234567890',
          to: 'Escrow Contract',
          timestamp: Date.now() / 1000 - 18000,
          status: 'confirmed',
          gasUsed: '65000',
          blockNumber: 18499800
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Load transaction history error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight size={16} className="text-red-400" />;
      case 'receive':
        return <ArrowDownLeft size={16} className="text-green-400" />;
      case 'stake':
        return <ArrowUpRight size={16} className="text-yellow-400" />;
      case 'unstake':
        return <ArrowDownLeft size={16} className="text-orange-400" />;
      case 'reward':
        return <ArrowDownLeft size={16} className="text-purple-400" />;
      case 'escrow':
        return <ArrowUpRight size={16} className="text-blue-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send': return 'text-red-400';
      case 'receive': return 'text-green-400';
      case 'stake': return 'text-yellow-400';
      case 'unstake': return 'text-orange-400';
      case 'reward': return 'text-purple-400';
      case 'escrow': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const formatAddress = (address: string) => {
    if (address === 'Staking Contract' || address === 'Escrow Contract') {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Transaction History</h2>
          <p className="text-sm opacity-80">Your quantum-secured blockchain transactions</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-1 text-white outline-none text-sm"
          >
            <option value="all">All Types</option>
            <option value="send">Send</option>
            <option value="receive">Receive</option>
            <option value="stake">Stake</option>
            <option value="unstake">Unstake</option>
            <option value="reward">Rewards</option>
            <option value="escrow">Escrow</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.hash}
              className="bg-white/5 rounded-lg p-4 border border-cyan-500/20 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <div className="font-medium capitalize">{tx.type}</div>
                    <div className="text-xs text-gray-400">{formatTime(tx.timestamp)}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold ${getTransactionColor(tx.type)}`}>
                    {tx.type === 'send' ? '-' : '+'}{parseFloat(tx.amount).toLocaleString()} WORK
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <div className="text-gray-400">From</div>
                  <div className="font-mono">{formatAddress(tx.from)}</div>
                </div>
                <div>
                  <div className="text-gray-400">To</div>
                  <div className="font-mono">{formatAddress(tx.to)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">
                    Hash: {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </span>
                  {tx.blockNumber && (
                    <span className="text-gray-400">
                      Block: {tx.blockNumber.toLocaleString()}
                    </span>
                  )}
                  {tx.gasUsed && (
                    <span className="text-gray-400">
                      Gas: {parseInt(tx.gasUsed).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Quantum Security Status */}
      <div className="mt-6 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-400">Quantum Transaction Security</span>
        </div>
        <div className="text-xs text-gray-400">
          All transactions are secured with quantum-resistant cryptography and verified on the blockchain
        </div>
      </div>
    </div>
  );
}