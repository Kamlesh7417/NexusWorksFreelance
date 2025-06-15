'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, User, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MessageSkeleton } from './loading-skeleton';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  project_id?: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: any;
  receiver?: any;
}

interface MessageListProps {
  userId: string;
  limit?: number;
  showViewAll?: boolean;
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
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
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

    if (userId) {
      loadMessages();
    }
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

  if (loading) {
    return <MessageSkeleton />;
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
        <p>No messages yet</p>
        <p className="text-sm">Start a conversation from a project page</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map(message => {
        const otherUser = message.sender_id === userId ? message.receiver : message.sender;
        const isIncoming = message.receiver_id === userId;
        
        return (
          <Link 
            key={message.id}
            href="/messages"
            className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-start gap-3">
              {otherUser?.avatar_url ? (
                <img 
                  src={otherUser.avatar_url} 
                  alt={otherUser.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <User size={18} className="text-cyan-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium text-white truncate">{otherUser?.full_name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {formatTime(message.created_at)}
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 truncate">
                  {isIncoming ? '' : 'You: '}
                  {message.content}
                </p>
                
                {!message.read && isIncoming && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">
                      New message
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
      
      {showViewAll && messages.length > 0 && (
        <Link 
          href="/messages"
          className="flex items-center justify-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors py-2"
        >
          View All Messages
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}