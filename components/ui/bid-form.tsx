'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DollarSign, Send, Loader2 } from 'lucide-react';

interface BidFormProps {
  projectId: string;
  userId: string;
  projectBudget: {
    min: number;
    max: number;
  };
  onBidSubmitted: () => void;
}

export function BidForm({ projectId, userId, projectBudget, onBidSubmitted }: BidFormProps) {
  const [amount, setAmount] = useState(projectBudget.min);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !message.trim()) {
      setError('Please provide both an amount and a message');
      return;
    }
    
    if (amount < projectBudget.min || amount > projectBudget.max * 1.5) {
      setError(`Bid amount should be between $${projectBudget.min} and $${projectBudget.max * 1.5}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('project_bids')
        .insert({
          project_id: projectId,
          freelancer_id: userId,
          amount,
          message: message.trim(),
          status: 'pending'
        });
      
      if (error) throw error;
      
      onBidSubmitted();
    } catch (err: any) {
      console.error('Error submitting bid:', err);
      setError(err.message || 'Failed to submit bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-cyan-400 mb-2">
          Your Bid Amount (USD)
        </label>
        <div className="relative">
          <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            placeholder="Enter your bid amount"
            min={projectBudget.min}
            max={projectBudget.max * 1.5}
            required
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Project budget: ${projectBudget.min.toLocaleString()} - ${projectBudget.max.toLocaleString()}
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-cyan-400 mb-2">
          Proposal Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 min-h-[150px]"
          placeholder="Introduce yourself and explain why you're a good fit for this project. Highlight relevant experience and skills."
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Submitting Bid...
          </>
        ) : (
          <>
            <Send size={16} />
            Submit Bid
          </>
        )}
      </button>
    </form>
  );
}