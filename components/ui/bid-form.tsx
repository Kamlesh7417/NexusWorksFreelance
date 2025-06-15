'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface BidFormProps {
  projectId: string;
  userId: string;
  projectBudget: {
    min: number;
    max: number;
  };
  onBidSubmitted?: () => void;
}

export function BidForm({ projectId, userId, projectBudget, onBidSubmitted }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate bid amount
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    // Validate bid message
    if (!bidMessage.trim()) {
      setError('Please enter a message with your bid');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase
        .from('project_bids')
        .insert({
          project_id: projectId,
          freelancer_id: userId,
          amount,
          message: bidMessage,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already bid on this project');
        }
        throw error;
      }

      setSuccess('Your bid has been submitted successfully!');
      setBidAmount('');
      setBidMessage('');
      
      if (onBidSubmitted) {
        onBidSubmitted();
      }
    } catch (err: any) {
      console.error('Bid submission error:', err);
      setError(err.message || 'Failed to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <p className="text-green-400">{success}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Your Bid Amount (USD)
          </label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            placeholder="Enter your bid amount"
            required
            min="1"
          />
          <p className="text-xs text-gray-400 mt-1">
            Project budget: ${projectBudget.min.toLocaleString()} - ${projectBudget.max.toLocaleString()}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Proposal Message
          </label>
          <textarea
            value={bidMessage}
            onChange={(e) => setBidMessage(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 min-h-[150px]"
            placeholder="Explain why you're the perfect fit for this project, your relevant experience, and your approach to completing it successfully."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
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
    </div>
  );
}