'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, User, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MessageSkeleton, ConversationSkeleton } from './loading-skeleton';

interface MessageListProps {
  userId: string;
  limit?: number;
  showViewAll?: boolean;
}

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

interface Conversation {
  user: any;
  lastMessage: Message;
  unreadCount: number;
  project?: any;
}

export function MessageList({ userId, limit = 5, showViewAll = true }: MessageListProps) {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadConversations = async () => {
      try {
        // Get all messages where user is sender or receiver
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
            receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role),
            project:projects(id, title)
          `)
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;

        // Group messages by conversation
        const conversationsMap = new Map<string, Conversation>();
        
        messagesData?.forEach(message => {
          const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
          const otherUser = message.sender_id === userId ? message.receiver : message.sender;
          
          if (!conversationsMap.has(otherUserId)) {
            conversationsMap.set(otherUserId, {
              user: otherUser,
              lastMessage: message,
              unreadCount: message.receiver_id === userId && !message.read ? 1 : 0,
              project: message.project
            });
          } else {
            const conversation = conversationsMap.get(otherUserId)!;
            
            // Update unread count
            if (message.receiver_id === userId && !message.read) {
              conversation.unreadCount += 1;
            }
            
            // Update last message if this one is newer
            if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
              conversation.lastMessage = message;
            }
          }
        });
        
        setConversations(Array.from(conversationsMap.values()).slice(0, limit));
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadConversations();
    }
  }, [userId, limit, supabase]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);
    
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
    return <ConversationSkeleton count={3} />;
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
        <p>No messages yet</p>
        <p className="text-sm">Start a conversation from a project page</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <Link
          key={conversation.user.id}
          href="/messages"
          className="block p-4 border border-white/10 hover:bg-white/5 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {conversation.user.avatar_url ? (
                <img 
                  src={conversation.user.avatar_url} 
                  alt={conversation.user.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <User size={18} className="text-cyan-400" />
                </div>
              )}
              {conversation.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white truncate">{conversation.user.full_name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{formatTime(conversation.lastMessage.created_at)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 truncate">
                {conversation.lastMessage.sender_id === userId ? 'You: ' : ''}
                {conversation.lastMessage.content}
              </p>
              {conversation.project && (
                <div className="mt-1">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                    {conversation.project.title}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
      
      {showViewAll && conversations.length > 0 && (
        <Link
          href="/messages"
          className="block text-center p-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <div className="flex items-center justify-center gap-1">
            View All Messages
            <ArrowRight size={14} />
          </div>
        </Link>
      )}
    </div>
  );
}