'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, User, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ConversationSkeleton } from './loading-skeleton';
import { getRelativeTime } from '@/lib/utils';

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
  project?: any;
}

interface MessageListProps {
  userId: string;
  limit?: number;
  showViewAll?: boolean;
}

export function MessageList({ userId, limit = 5, showViewAll = true }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Get recent messages where user is sender or receiver
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

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadMessages();
    }
  }, [userId, limit, supabase]);

  // Group messages by conversation
  const conversations = messages.reduce((acc, message) => {
    const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
    const otherUser = message.sender_id === userId ? message.receiver : message.sender;
    
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        user: otherUser,
        messages: [message],
        lastMessage: message
      };
    } else {
      acc[otherUserId].messages.push(message);
      
      // Update last message if this one is newer
      if (new Date(message.created_at) > new Date(acc[otherUserId].lastMessage.created_at)) {
        acc[otherUserId].lastMessage = message;
      }
    }
    
    return acc;
  }, {} as Record<string, { user: any, messages: Message[], lastMessage: Message }>);

  const conversationList = Object.values(conversations);

  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (conversationList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
        <p>No messages yet</p>
        <p className="text-sm">Start a conversation from a project page</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversationList.map(conversation => (
        <Link 
          key={conversation.user.id}
          href="/messages"
          className="block p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            {conversation.user.avatar_url ? (
              <img 
                src={conversation.user.avatar_url} 
                alt={conversation.user.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <User size={16} className="text-cyan-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-white truncate">{conversation.user.full_name}</h4>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} />
                  {getRelativeTime(conversation.lastMessage.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate">
                {conversation.lastMessage.sender_id === userId ? 'You: ' : ''}
                {conversation.lastMessage.content}
              </p>
              {conversation.lastMessage.project && (
                <div className="mt-1">
                  <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                    {conversation.lastMessage.project.title}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
      
      {showViewAll && conversationList.length > 0 && (
        <Link 
          href="/messages" 
          className="block text-center text-cyan-400 hover:text-cyan-300 py-2 mt-2"
        >
          <span className="flex items-center justify-center gap-1">
            View All Messages
            <ArrowRight size={14} />
          </span>
        </Link>
      )}
    </div>
  );
}