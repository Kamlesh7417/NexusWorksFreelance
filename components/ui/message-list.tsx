'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, User, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface MessageListProps {
  userId: string;
  limit?: number;
  showViewAll?: boolean;
}

export function MessageList({ userId, limit = 5, showViewAll = true }: MessageListProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
            receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role),
            project:projects(id, title)
          `)
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }
        
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        }, 
        (payload) => {
          // Fetch the complete message with relations
          supabase
            .from('messages')
            .select(`
              *,
              sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
              receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role),
              project:projects(id, title)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setMessages(prev => [data, ...prev.slice(0, limit - 1)]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, limit, supabase]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
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
        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
        <p>No messages yet</p>
        <p className="text-sm">Your messages will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map(message => {
        const otherUser = message.sender_id === userId ? message.receiver : message.sender;
        const isUnread = message.receiver_id === userId && !message.read;
        
        return (
          <Link 
            key={message.id}
            href={`/messages?user=${otherUser.id}`}
            className="block"
          >
            <div className={`p-3 rounded-lg transition-colors ${
              isUnread ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-white/5 hover:bg-white/10'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {otherUser.avatar_url ? (
                  <img 
                    src={otherUser.avatar_url} 
                    alt={otherUser.full_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <User size={16} className="text-cyan-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-white truncate">{otherUser.full_name}</h3>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(message.created_at)}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 line-clamp-2">
                {message.sender_id === userId ? 'You: ' : ''}
                {message.content}
              </p>
              
              {message.project && (
                <div className="mt-2">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                    {message.project.title}
                  </span>
                </div>
              )}
            </div>
          </Link>
        );
      })}
      
      {showViewAll && messages.length > 0 && (
        <div className="text-center mt-4">
          <Link 
            href="/messages"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            View All Messages
          </Link>
        </div>
      )}
    </div>
  );
}