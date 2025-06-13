'use client';

import { useState, useEffect } from 'react';
import { blockchainService, WalletInfo } from '@/lib/blockchain';
import { Wallet, Zap, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

export function WalletConnector() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const info = await blockchainService.getWalletInfo();
    setWalletInfo(info);
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const info = await blockchainService.connectWallet();
      if (info) {
        setWalletInfo(info);
      } else {
        setError('Failed to connect wallet');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    await blockchainService.disconnectWallet();
    setWalletInfo(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      137: 'Polygon',
      80001: 'Polygon Mumbai',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet'
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  if (!walletInfo) {
    return (
      <div className="nexus-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet size={32} className="text-cyan-400" />
          </div>
          
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Connect Neural Wallet</h3>
          <p className="text-sm opacity-80 mb-6">
            Connect your quantum-encrypted wallet to access the WORK token ecosystem
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="nexus-action-btn w-full flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                Establishing Neural Link...
              </>
            ) : (
              <>
                <Zap size={16} />
                Connect Wallet
              </>
            )}
          </button>

          <div className="mt-4 text-xs opacity-60">
            <p>Supported wallets: MetaMask, WalletConnect, Coinbase Wallet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-cyan-400">Neural Wallet Interface</h3>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-green-400 text-sm">Connected</span>
        </div>
      </div>

      {/* Wallet Status */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-4 mb-4 border border-cyan-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Wallet Address</span>
          <a
            href={`https://etherscan.io/address/${walletInfo.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        </div>
        <div className="font-mono text-cyan-400 text-sm mb-3">
          {formatAddress(walletInfo.address)}
        </div>
        
        <div className="text-xs text-gray-400">
          Network: {getNetworkName(walletInfo.chainId)}
        </div>
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">ETH Balance</div>
          <div className="font-bold text-white">
            {parseFloat(walletInfo.balance).toFixed(4)} ETH
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">WORK Balance</div>
          <div className="font-bold text-cyan-400">
            {parseFloat(walletInfo.workBalance).toFixed(2)} WORK
          </div>
        </div>
      </div>

      {/* Staking Info */}
      <div className="bg-white/5 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Quantum Staking</span>
          <Zap size={14} className="text-yellow-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Staked</div>
            <div className="font-semibold text-yellow-400">
              {parseFloat(walletInfo.stakedBalance).toFixed(2)} WORK
            </div>
          </div>
          <div>
            <div className="text-gray-400">Pending Rewards</div>
            <div className="font-semibold text-green-400">
              {parseFloat(walletInfo.pendingRewards).toFixed(4)} WORK
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="nexus-action-btn flex-1 text-sm py-2">
          Send WORK
        </button>
        <button className="nexus-action-btn flex-1 text-sm py-2">
          Stake Tokens
        </button>
        <button 
          onClick={disconnectWallet}
          className="nexus-back-btn text-sm py-2 px-3"
        >
          Disconnect
        </button>
      </div>

      {/* Quantum Encryption Status */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-purple-400">Quantum Encryption Active</span>
        </div>
        <div className="text-xs text-gray-400">
          Your transactions are secured with 256-qubit encryption
        </div>
      </div>
    </div>
  );
}