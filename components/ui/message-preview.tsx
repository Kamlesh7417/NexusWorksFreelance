'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MessagePreviewProps {
  userId: string;
  projectId?: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onClose?: () => void;
}

export function MessagePreview({ 
  userId, 
  projectId, 
  recipientId, 
  recipientName, 
  recipientAvatar,
  onClose 
}: MessagePreviewProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          project_id: projectId,
          content: message.trim(),
          read: false
        });

      if (error) throw error;
      
      setMessage('');
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        if (onClose) onClose();
      }, 3000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const viewAllMessages = () => {
    router.push('/messages');
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare size={18} className="text-cyan-400" />
          <h3 className="font-semibold text-white">Message {recipientName}</h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/40 rounded-lg">
          <p className="text-sm text-green-400">Message sent successfully!</p>
        </div>
      )}
      
      <div className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none"
          rows={4}
        />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={sendMessage}
          disabled={!message.trim() || sending}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send Message'}
        </button>
        
        <button
          onClick={viewAllMessages}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
        >
          View All Messages
        </button>
      </div>
    </div>
  );
}