'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, User, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { LoadingSkeleton, ConversationSkeleton } from './loading-skeleton';

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

interface Conversation {
  user: any;
  lastMessage: Message;
  unreadCount: number;
  project?: any;
}

interface MessageListProps {
  userId: string;
  limit?: number;
  showViewAll?: boolean;
}

export function MessageList({ userId, limit = 5, showViewAll = true }: MessageListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadConversations();
    
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
          const newMessage = payload.new as Message;
          updateConversationWithNewMessage(newMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, supabase]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
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
      
      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const updateConversationWithNewMessage = (message: Message) => {
    setConversations(prev => {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      const existingConvIndex = prev.findIndex(c => c.user.id === otherUserId);
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        const conversation = { ...updatedConversations[existingConvIndex] };
        
        conversation.lastMessage = message;
        
        // Update unread count if user is receiver
        if (message.receiver_id === userId && !message.read) {
          conversation.unreadCount += 1;
        }
        
        // Move conversation to top
        updatedConversations.splice(existingConvIndex, 1);
        updatedConversations.unshift(conversation);
        
        return updatedConversations;
      } else {
        // Create new conversation
        const otherUser = message.sender_id === userId ? message.receiver : message.sender;
        
        const newConversation: Conversation = {
          user: otherUser,
          lastMessage: message,
          unreadCount: message.receiver_id === userId && !message.read ? 1 : 0,
          project: message.project
        };
        
        return [newConversation, ...prev];
      }
    });
  };

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
    return <ConversationSkeleton count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (conversations.length === 0) {
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
      {conversations.slice(0, limit).map((conversation) => (
        <Link
          key={conversation.user.id}
          href="/messages"
          className="block p-3 rounded-lg hover:bg-white/5 transition-colors"
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
                  <User size={16} className="text-cyan-400" />
                </div>
              )}
              {conversation.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white truncate">{conversation.user.full_name}</h3>
                <span className="text-xs text-gray-400">
                  {formatTime(conversation.lastMessage.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate">
                {conversation.lastMessage.sender_id === userId ? 'You: ' : ''}
                {conversation.lastMessage.content}
              </p>
            </div>
          </div>
        </Link>
      ))}
      
      {showViewAll && conversations.length > 0 && (
        <Link 
          href="/messages" 
          className="block text-center text-sm text-cyan-400 hover:text-cyan-300 py-2"
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