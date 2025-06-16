'use client';

import { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const [sending, setSending] = useState(false);
  const supabase = createClientComponentClient();

  const handleClick = async () => {
    // If it's just an icon button, redirect to messages page
    if (variant === 'icon') {
      window.location.href = `/messages`;
      return;
    }

    // Otherwise, send a message and then redirect
    try {
      setSending(true);
      
      // Send initial message if this is a new conversation
      const { data: existingMessages, error: checkError } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking existing messages:', checkError);
        throw checkError;
      }
      
      // If no existing messages, send an initial message
      if (!existingMessages || existingMessages.length === 0) {
        const initialMessage = `Hello! I'd like to discuss ${projectId ? 'a project' : 'something'} with you.`;
        
        const { error: sendError } = await supabase
          .from('messages')
          .insert({
            sender_id: userId,
            receiver_id: recipientId,
            project_id: projectId || null,
            content: initialMessage,
            read: false
          });
        
        if (sendError) {
          console.error('Error sending message:', sendError);
          throw sendError;
        }
      }
      
      // Redirect to messages page
      window.location.href = `/messages`;
    } catch (error) {
      console.error('Message button error:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={sending}
        className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition-colors"
      >
        {sending ? (
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
      disabled={sending}
      className={`bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {sending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Starting Conversation...
        </>
      ) : (
        <>
          <MessageSquare size={16} />
          Message {recipientName || 'User'}
        </>
      )}
    </button>
  );
}