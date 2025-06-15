'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video, 
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Image,
  File,
  Smile,
  Loader2,
  User,
  Users,
  AlertCircle,
  X
} from 'lucide-react';
import Link from 'next/link';

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

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers] = useState<string[]>(['user_1', 'user_3']); // Mock online users
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        setUser(user);
        await loadConversations(user.id);
      } catch (error) {
        console.error('Auth error:', error);
        setError('Authentication error. Please sign in again.');
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, supabase]);

  useEffect(() => {
    if (user) {
      // Subscribe to new messages
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          }, 
          (payload) => {
            const newMessage = payload.new as Message;
            
            // Update messages if in current conversation
            if (selectedConversation && 
                (newMessage.sender_id === selectedConversation.user.id || 
                 newMessage.receiver_id === selectedConversation.user.id)) {
              setMessages(prev => [...prev, newMessage]);
              markMessageAsRead(newMessage.id);
            }
            
            // Update conversations list
            updateConversationWithNewMessage(newMessage);
            
            // Show browser notification
            showBrowserNotification(newMessage);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user, selectedConversation, supabase]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async (userId: string) => {
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
      
      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations. Please try again.');
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
          receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role),
          project:projects(id, title)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      setMessages(messagesData || []);
      
      // Mark unread messages as read
      const unreadMessageIds = messagesData
        ?.filter(m => m.receiver_id === user.id && !m.read)
        .map(m => m.id) || [];
        
      if (unreadMessageIds.length > 0) {
        await markMessagesAsRead(unreadMessageIds);
        
        // Update unread count in conversations
        setConversations(prev => 
          prev.map(conv => 
            conv.user.id === otherUserId 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages. Please try again.');
    }
  };

  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    setSendingMessage(true);
    
    try {
      const messageData = {
        sender_id: user.id,
        receiver_id: selectedConversation.user.id,
        project_id: selectedConversation.project?.id,
        content: newMessage.trim(),
        read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
          receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role),
          project:projects(id, title)
        `)
        .single();

      if (error) throw error;
      
      // Add message to current conversation
      setMessages(prev => [...prev, data]);
      
      // Update conversations list
      updateConversationWithNewMessage(data);
      
      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const updateConversationWithNewMessage = (message: Message) => {
    setConversations(prev => {
      const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
      const existingConvIndex = prev.findIndex(c => c.user.id === otherUserId);
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        const conversation = { ...updatedConversations[existingConvIndex] };
        
        conversation.lastMessage = message;
        
        // Update unread count if user is receiver
        if (message.receiver_id === user?.id && !message.read) {
          conversation.unreadCount += 1;
        }
        
        // Move conversation to top
        updatedConversations.splice(existingConvIndex, 1);
        updatedConversations.unshift(conversation);
        
        return updatedConversations;
      } else {
        // Create new conversation
        const otherUser = message.sender_id === user?.id ? message.receiver : message.sender;
        
        const newConversation: Conversation = {
          user: otherUser,
          lastMessage: message,
          unreadCount: message.receiver_id === user?.id && !message.read ? 1 : 0,
          project: message.project
        };
        
        return [newConversation, ...prev];
      }
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.user.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showBrowserNotification = (message: Message) => {
    // Only show notification if user is receiver and not in the current conversation
    if (message.receiver_id !== user?.id) return;
    if (selectedConversation?.user.id === message.sender_id) return;
    
    // Check if browser notifications are supported and permitted
    if (Notification.permission === 'granted') {
      const senderName = message.sender?.full_name || 'Someone';
      const notif = new Notification('New message from ' + senderName, {
        body: message.content.substring(0, 60) + (message.content.length > 60 ? '...' : ''),
        icon: message.sender?.avatar_url || '/favicon.ico'
      });
      
      notif.onclick = () => {
        window.focus();
        const conversation = conversations.find(c => c.user.id === message.sender_id);
        if (conversation) {
          handleSelectConversation(conversation);
        }
      };
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  const handleAttachmentUpload = (type: 'image' | 'file') => {
    // Implement file upload logic here
    setShowAttachmentOptions(false);
    alert(`${type} upload functionality will be implemented soon!`);
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

  const getMessageStatus = (message: Message) => {
    if (message.sender_id !== user?.id) return null;
    
    return message.read ? (
      <CheckCheck size={16} className="text-green-400" />
    ) : (
      <Check size={16} className="text-gray-400" />
    );
  };

  const filteredConversations = conversations.filter(conv => 
    conv.user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden h-[calc(100vh-180px)] flex">
          {/* Conversations Sidebar */}
          <div className={`w-full md:w-80 border-r border-white/10 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">Messages</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.user.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors ${
                      selectedConversation?.user.id === conversation.user.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {conversation.user.avatar_url ? (
                          <img 
                            src={conversation.user.avatar_url} 
                            alt={conversation.user.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                            <User size={20} className="text-cyan-400" />
                          </div>
                        )}
                        {onlineUsers.includes(conversation.user.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-white truncate">{conversation.user.full_name}</h3>
                          <span className="text-xs text-gray-400">
                            {formatTime(conversation.lastMessage.created_at)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-400 truncate">
                            {conversation.lastMessage.sender_id === user?.id ? 'You: ' : ''}
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
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No conversations found</p>
                  <p className="text-sm">
                    {searchTerm ? 'Try a different search term' : 'Start a new conversation from a project page'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message Thread */}
          {selectedConversation ? (
            <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    className="md:hidden text-gray-400 hover:text-white"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  {selectedConversation.user.avatar_url ? (
                    <img 
                      src={selectedConversation.user.avatar_url} 
                      alt={selectedConversation.user.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <User size={18} className="text-cyan-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{selectedConversation.user.full_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 capitalize">{selectedConversation.user.role}</span>
                      {onlineUsers.includes(selectedConversation.user.id) && (
                        <span className="text-xs text-green-400">Online</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5">
                    <Phone size={18} />
                  </button>
                  <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5">
                    <Video size={18} />
                  </button>
                  <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
              
              {/* Project Info (if applicable) */}
              {selectedConversation.project && (
                <div className="px-4 py-2 bg-purple-500/10 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-purple-400">Project:</span>
                      <Link 
                        href={`/projects/${selectedConversation.project.id}`}
                        className="text-sm text-white hover:text-purple-400 transition-colors"
                      >
                        {selectedConversation.project.title}
                      </Link>
                    </div>
                    <Link 
                      href={`/projects/${selectedConversation.project.id}`}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  <>
                    {messages.map((message, index) => {
                      const isFirstMessageOfDay = index === 0 || 
                        formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);
                      
                      const isCurrentUser = message.sender_id === user?.id;
                      
                      return (
                        <div key={message.id}>
                          {isFirstMessageOfDay && (
                            <div className="flex items-center justify-center my-4">
                              <div className="bg-white/10 px-3 py-1 rounded-full">
                                <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] ${isCurrentUser ? 'bg-cyan-500/20 rounded-tl-lg rounded-tr-lg rounded-bl-lg' : 'bg-white/10 rounded-tr-lg rounded-tl-lg rounded-br-lg'}`}>
                              <div className="p-3">
                                <p className="text-white">{message.content}</p>
                              </div>
                              <div className={`px-3 pb-1 flex items-center justify-end gap-1 text-xs ${isCurrentUser ? 'text-cyan-400' : 'text-gray-400'}`}>
                                <span>{formatTime(message.created_at)}</span>
                                {getMessageStatus(message)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                      <p className="text-gray-400">No messages yet</p>
                      <p className="text-sm text-gray-500">Send a message to start the conversation</p>
                    </div>
                  </div>
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-tr-lg rounded-tl-lg rounded-br-lg p-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    <div className="relative">
                      <button 
                        onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5"
                      >
                        <Paperclip size={18} />
                      </button>
                      
                      {showAttachmentOptions && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-white/20 rounded-lg shadow-xl p-2 flex flex-col gap-2 min-w-[150px]">
                          <button 
                            onClick={() => handleAttachmentUpload('image')}
                            className="flex items-center gap-2 p-2 hover:bg-white/5 rounded text-left"
                          >
                            <Image size={16} className="text-cyan-400" />
                            <span>Image</span>
                          </button>
                          <button 
                            onClick={() => handleAttachmentUpload('file')}
                            className="flex items-center gap-2 p-2 hover:bg-white/5 rounded text-left"
                          >
                            <File size={16} className="text-cyan-400" />
                            <span>Document</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5"
                      >
                        <Smile size={18} />
                      </button>
                      
                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-white/20 rounded-lg shadow-xl p-2">
                          <div className="grid grid-cols-6 gap-2">
                            {['😊', '👍', '❤️', '😂', '🎉', '🔥', '👏', '🙏', '💯', '🚀', '✅', '❓'].map(emoji => (
                              <button 
                                key={emoji}
                                onClick={() => {
                                  setNewMessage(prev => prev + emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="text-xl p-1 hover:bg-white/10 rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-2 bg-cyan-500/20 text-cyan-400 rounded-full hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={64} className="mx-auto mb-4 text-gray-400 opacity-30" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Conversation</h3>
                <p className="text-gray-500 max-w-md">
                  Choose a conversation from the sidebar or start a new one from a project page
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500/40 rounded-lg p-4 max-w-md animate-fade-in-up">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-white">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}