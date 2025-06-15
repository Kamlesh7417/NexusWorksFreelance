'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, User, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface MessageListProps {
  userId: string;
  limit?: number;
  showViewAll?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: any;
  receiver?: any;
}

export function MessageList({ userId, limit = 5, showViewAll = true }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
            receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role)
          `)
          .eq('receiver_id', userId)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('unread_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        }, 
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
              receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (data) {
            setMessages(prev => [data, ...prev].slice(0, limit));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, limit, supabase]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
        
      // Update local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
        <p>No unread messages</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map(message => (
        <div 
          key={message.id} 
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {message.sender?.avatar_url ? (
                <img 
                  src={message.sender.avatar_url} 
                  alt={message.sender.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <User size={14} className="text-cyan-400" />
                </div>
              )}
              <div>
                <div className="font-medium text-white">{message.sender?.full_name}</div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{formatTime(message.created_at)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => markAsRead(message.id)}
              className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-2 py-1 rounded transition-colors"
            >
              Mark Read
            </button>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2 mb-2">{message.content}</p>
          <div className="flex justify-between">
            <Link 
              href="/messages" 
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Reply
            </Link>
          </div>
        </div>
      ))}
      
      {showViewAll && messages.length > 0 && (
        <div className="text-center pt-2">
          <Link 
            href="/messages"
            className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
          >
            View All Messages
          </Link>
        </div>
      )}
    </div>
  );
}