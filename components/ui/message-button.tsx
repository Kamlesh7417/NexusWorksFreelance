'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, Loader2 } from 'lucide-react';

interface MessageButtonProps {
  userId: string;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  projectId?: string;
  className?: string;
  variant?: 'default' | 'icon';
}

export function MessageButton({ 
  userId, 
  recipientId, 
  recipientName, 
  recipientAvatar,
  projectId,
  className = '',
  variant = 'default'
}: MessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleClick = async () => {
    if (userId === recipientId) return;
    
    setLoading(true);
    
    try {
      // Check if there's an existing conversation
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
        .limit(1);
      
      // If there's an existing conversation, redirect to messages page
      if (existingMessages && existingMessages.length > 0) {
        window.location.href = `/messages?user=${recipientId}`;
        return;
      }
      
      // If no existing conversation, create a new message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          project_id: projectId || null,
          content: `Hello! I'd like to discuss a project with you.`,
          read: false
        });
      
      if (error) throw error;
      
      // Redirect to messages page
      window.location.href = `/messages?user=${recipientId}`;
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={loading || userId === recipientId}
        className={`p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={`Message ${recipientName || 'User'}`}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin text-cyan-400" />
        ) : (
          <MessageSquare size={16} className="text-cyan-400" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || userId === recipientId}
      className={`flex items-center justify-center gap-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <MessageSquare size={16} />
      )}
      Message{recipientName ? ` ${recipientName.split(' ')[0]}` : ''}
    </button>
  );
}