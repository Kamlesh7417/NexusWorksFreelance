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
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Get conversations (grouped by other user)
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
            receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role),
            project:projects(id, title)
          `)
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(50); // Get more than we need for grouping
        
        if (messagesError) throw messagesError;
        
        // Group messages by conversation
        const conversationsMap = new Map();
        
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
            const conversation = conversationsMap.get(otherUserId);
            
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
        
        const conversations = Array.from(conversationsMap.values());
        
        // Sort by last message date and limit
        conversations.sort((a, b) => 
          new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
        );
        
        setMessages(conversations.slice(0, limit));
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
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
        () => {
          fetchMessages();
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
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
        <p>No messages yet</p>
        <p className="text-sm">Your conversations will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((conversation) => (
        <Link 
          key={conversation.user.id}
          href="/messages"
          className="block bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
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
                <h3 className="font-semibold text-white truncate">{conversation.user.full_name}</h3>
                <span className="text-xs text-gray-400">
                  {formatTime(conversation.lastMessage.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400 truncate">
                  {conversation.lastMessage.sender_id === userId ? 'You: ' : ''}
                  {conversation.lastMessage.content}
                </p>
                {conversation.unreadCount > 0 && (
                  <span className="bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
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
      
      {showViewAll && messages.length > 0 && (
        <div className="text-center pt-2">
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