'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleClick = async () => {
    if (userId === recipientId) return;
    
    setLoading(true);
    
    try {
      // First, check if there's an existing conversation
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
        .limit(1);
      
      // If no existing conversation, create an initial message
      if (!existingMessages || existingMessages.length === 0) {
        const initialMessage = {
          sender_id: userId,
          receiver_id: recipientId,
          project_id: projectId || null,
          content: `Hello! I'd like to discuss ${projectId ? 'this project' : 'a potential collaboration'} with you.`,
          read: false
        };
        
        await supabase.from('messages').insert(initialMessage);
      }
      
      // Navigate to messages page
      router.push('/messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`p-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MessageSquare size={16} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <MessageSquare size={16} />
      )}
      Message {recipientName || 'User'}
    </button>
  );
}