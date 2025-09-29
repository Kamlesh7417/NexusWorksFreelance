'use client';

import { useState, useEffect, useRef } from 'react';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';
import { useConsole } from './unified-console';
// import { useRealtimeMessageData, useConnectionStatus } from '@/lib/hooks/use-realtime-data';
// import { useMessageWebSocket } from '@/lib/services/message-websocket';
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
  Image,
  File,
  Smile,
  Loader2,
  User,
  Users,
  MessageSquare,
  Archive,
  Star,
  Trash2,
  Filter,
  X,
  Plus
} from 'lucide-react';

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
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  size: number;
}

interface Conversation {
  user: any;
  lastMessage: Message;
  unreadCount: number;
  project?: any;
  archived?: boolean;
  starred?: boolean;
}

interface MessageCenterProps {
  className?: string;
}

export function MessageCenter({ className = '' }: MessageCenterProps) {
  const { user } = useDjangoAuth();
  const { addNotification } = useConsole();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers] = useState<string[]>(['user_1', 'user_3']); // Mock online users
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'archived' | 'starred'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageSearchRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

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
            
            // Add notification to console
            addNotification({
              id: `message-${newMessage.id}`,
              type: 'info',
              title: 'New Message',
              message: `New message from ${newMessage.sender?.full_name || 'Someone'}`,
              timestamp: new Date(),
              read: false
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user, selectedConversation, supabase, addNotification]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Close conversation menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (showConversationMenu) {
        setShowConversationMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConversationMenu]);

  const loadConversations = async () => {
    if (!user) return;
    
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
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by conversation
      const conversationsMap = new Map<string, Conversation>();
      
      messagesData?.forEach(message => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
        
        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            user: otherUser,
            lastMessage: message,
            unreadCount: message.receiver_id === user.id && !message.read ? 1 : 0,
            project: message.project,
            archived: false,
            starred: false
          });
        } else {
          const conversation = conversationsMap.get(otherUserId)!;
          
          // Update unread count
          if (message.receiver_id === user.id && !message.read) {
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
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user) return;
    
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
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation || !user) return;
    
    setSendingMessage(true);
    
    try {
      // First, upload any attachments
      const uploadedFiles = [];
      
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `messages/${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);
          
        uploadedFiles.push({
          name: file.name,
          url: data.publicUrl,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          size: file.size
        });
      }
      
      // Create message content with attachments
      let finalContent = newMessage.trim();
      
      if (uploadedFiles.length > 0) {
        const attachmentText = uploadedFiles.map(file => 
          `[${file.type === 'image' ? 'Image' : 'File'}: ${file.name}](${file.url})`
        ).join('\n');
        
        finalContent = finalContent 
          ? `${finalContent}\n\n${attachmentText}`
          : attachmentText;
      }

      const messageData = {
        sender_id: user.id,
        receiver_id: selectedConversation.user.id,
        project_id: selectedConversation.project?.id,
        content: finalContent,
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
      setAttachments([]);
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
          project: message.project,
          archived: false,
          starred: false
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    
    // Validate file size and type
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const validFiles = newFiles.filter(file => {
      if (file.size > maxFileSize) {
        addNotification({
          id: `file-size-${Date.now()}`,
          type: 'error',
          title: 'File Too Large',
          message: `${file.name} is too large. Maximum file size is 10MB.`,
          timestamp: new Date(),
          read: false
        });
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        addNotification({
          id: `file-type-${Date.now()}`,
          type: 'error',
          title: 'File Type Not Supported',
          message: `${file.name} file type is not supported.`,
          timestamp: new Date(),
          read: false
        });
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAttachmentOptions(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const searchMessages = (searchTerm: string) => {
    if (!searchTerm.trim()) return messages;
    
    const searchLower = searchTerm.toLowerCase();
    return messages.filter(message => 
      message.content.toLowerCase().includes(searchLower)
    );
  };

  const handleMessageSearch = (term: string) => {
    setMessageSearchTerm(term);
  };

  const clearMessageSearch = () => {
    setMessageSearchTerm('');
    setShowMessageSearch(false);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.user.id === conversationId);
      if (!conversation) return;

      // In a real implementation, you would delete from the backend
      // For now, we'll just remove from local state
      setConversations(prev => prev.filter(c => c.user.id !== conversationId));
      
      // If this was the selected conversation, clear selection
      if (selectedConversation?.user.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      addNotification({
        id: `delete-${conversationId}`,
        type: 'success',
        title: 'Conversation Deleted',
        message: `Conversation with ${conversation.user.full_name} has been deleted`,
        timestamp: new Date(),
        read: false
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation. Please try again.');
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleConversationArchive = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.user.id === conversationId);
      if (!conversation) return;

      // Update local state immediately for better UX
      setConversations(prev => 
        prev.map(conv => 
          conv.user.id === conversationId 
            ? { ...conv, archived: !conv.archived }
            : conv
        )
      );

      // In a real implementation, you would save this to the backend
      // For now, we'll just update local state
      addNotification({
        id: `archive-${conversationId}`,
        type: 'success',
        title: conversation.archived ? 'Conversation Unarchived' : 'Conversation Archived',
        message: `Conversation with ${conversation.user.full_name} has been ${conversation.archived ? 'unarchived' : 'archived'}`,
        timestamp: new Date(),
        read: false
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      setError('Failed to archive conversation. Please try again.');
    }
  };

  const toggleConversationStar = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.user.id === conversationId);
      if (!conversation) return;

      // Update local state immediately for better UX
      setConversations(prev => 
        prev.map(conv => 
          conv.user.id === conversationId 
            ? { ...conv, starred: !conv.starred }
            : conv
        )
      );

      // In a real implementation, you would save this to the backend
      addNotification({
        id: `star-${conversationId}`,
        type: 'success',
        title: conversation.starred ? 'Conversation Unstarred' : 'Conversation Starred',
        message: `Conversation with ${conversation.user.full_name} has been ${conversation.starred ? 'unstarred' : 'starred'}`,
        timestamp: new Date(),
        read: false
      });
    } catch (error) {
      console.error('Error starring conversation:', error);
      setError('Failed to star conversation. Please try again.');
    }
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

  const filteredConversations = conversations.filter(conv => {
    // Apply search filter - search in user name, last message content, and project title
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      conv.user.full_name.toLowerCase().includes(searchLower) ||
      conv.lastMessage.content.toLowerCase().includes(searchLower) ||
      (conv.project?.title && conv.project.title.toLowerCase().includes(searchLower));
    
    // Apply type filter
    let matchesFilter = true;
    switch (filterType) {
      case 'unread':
        matchesFilter = conv.unreadCount > 0;
        break;
      case 'archived':
        matchesFilter = conv.archived === true;
        break;
      case 'starred':
        matchesFilter = conv.starred === true;
        break;
      case 'all':
      default:
        matchesFilter = !conv.archived; // Don't show archived in 'all'
        break;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-2" />
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-2 flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="flex-1 flex">
        {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 border-r border-gray-700 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                <Filter size={16} />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'starred', label: 'Starred' },
                { key: 'archived', label: 'Archived' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterType === filter.key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.user.id}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-4 border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors group ${
                  selectedConversation?.user.id === conversation.user.id ? 'bg-gray-800' : ''
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">{conversation.user.full_name}</h3>
                        {conversation.starred && <Star size={14} className="text-yellow-400 fill-current" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {formatTime(conversation.lastMessage.created_at)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleConversationStar(conversation.user.id);
                            }}
                            className={`p-1 transition-colors ${conversation.starred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                            title={conversation.starred ? 'Unstar conversation' : 'Star conversation'}
                          >
                            <Star size={12} className={conversation.starred ? 'fill-current' : ''} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleConversationArchive(conversation.user.id);
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title={conversation.archived ? 'Unarchive conversation' : 'Archive conversation'}
                          >
                            <Archive size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conversation.user.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete conversation"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
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
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
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
              <button 
                onClick={() => {
                  setShowMessageSearch(!showMessageSearch);
                  if (!showMessageSearch) {
                    setTimeout(() => messageSearchRef.current?.focus(), 100);
                  }
                }}
                className={`p-2 rounded-full transition-colors ${showMessageSearch ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                <Search size={18} />
              </button>
              <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700">
                <Phone size={18} />
              </button>
              <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700">
                <Video size={18} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowConversationMenu(!showConversationMenu)}
                  className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
                >
                  <MoreVertical size={18} />
                </button>
                {showConversationMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        toggleConversationStar(selectedConversation.user.id);
                        setShowConversationMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Star size={16} className={selectedConversation.starred ? 'text-yellow-400 fill-current' : 'text-gray-400'} />
                      {selectedConversation.starred ? 'Unstar' : 'Star'} Conversation
                    </button>
                    <button
                      onClick={() => {
                        toggleConversationArchive(selectedConversation.user.id);
                        setShowConversationMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Archive size={16} className="text-gray-400" />
                      {selectedConversation.archived ? 'Unarchive' : 'Archive'} Conversation
                    </button>
                    <button
                      onClick={() => {
                        deleteConversation(selectedConversation.user.id);
                        setShowConversationMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Conversation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Project Info (if applicable) */}
          {selectedConversation.project && (
            <div className="px-4 py-2 bg-purple-500/10 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-purple-400">Project:</span>
                  <span className="text-sm text-white">{selectedConversation.project.title}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Message Search */}
          {showMessageSearch && (
            <div className="px-4 py-2 border-b border-gray-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={messageSearchRef}
                  type="text"
                  placeholder="Search messages..."
                  value={messageSearchTerm}
                  onChange={(e) => handleMessageSearch(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-10 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={clearMessageSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(() => {
              const displayMessages = messageSearchTerm ? searchMessages(messageSearchTerm) : messages;
              
              if (displayMessages.length > 0) {
                return (
                  <>
                    {messageSearchTerm && (
                      <div className="text-center py-2">
                        <span className="text-sm text-cyan-400">
                          {displayMessages.length} message{displayMessages.length !== 1 ? 's' : ''} found
                        </span>
                      </div>
                    )}
                    {displayMessages.map((message, index) => {
                      const isFirstMessageOfDay = index === 0 || 
                        formatDate(message.created_at) !== formatDate(displayMessages[index - 1].created_at);
                      
                      const isCurrentUser = message.sender_id === user?.id;
                      
                      // Parse message content for attachments
                      const attachmentRegex = /\[(Image|File): ([^\]]+)\]\(([^)]+)\)/g;
                      const attachments = [];
                      let contentWithoutAttachments = message.content;
                      let match;
                      
                      while ((match = attachmentRegex.exec(message.content)) !== null) {
                        attachments.push({
                          type: match[1].toLowerCase(),
                          name: match[2],
                          url: match[3]
                        });
                        contentWithoutAttachments = contentWithoutAttachments.replace(match[0], '').trim();
                      }
                      
                      return (
                        <div key={message.id}>
                          {isFirstMessageOfDay && !messageSearchTerm && (
                            <div className="flex items-center justify-center my-4">
                              <div className="bg-gray-700 px-3 py-1 rounded-full">
                                <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] ${isCurrentUser ? 'bg-cyan-500/20 rounded-tl-lg rounded-tr-lg rounded-bl-lg' : 'bg-gray-700 rounded-tr-lg rounded-tl-lg rounded-br-lg'}`}>
                              {contentWithoutAttachments && (
                                <div className="p-3">
                                  <p className="text-white whitespace-pre-wrap">{contentWithoutAttachments}</p>
                                </div>
                              )}
                              
                              {/* Render attachments */}
                              {attachments.length > 0 && (
                                <div className="px-3 pb-3 space-y-2">
                                  {attachments.map((attachment, attIndex) => (
                                    <div key={attIndex} className="border border-gray-600 rounded-lg overflow-hidden">
                                      {attachment.type === 'image' ? (
                                        <img 
                                          src={attachment.url} 
                                          alt={attachment.name}
                                          className="max-w-full h-auto cursor-pointer hover:opacity-80"
                                          onClick={() => window.open(attachment.url, '_blank')}
                                        />
                                      ) : (
                                        <div className="p-3 flex items-center gap-2 bg-gray-800">
                                          <File size={16} className="text-cyan-400" />
                                          <span className="text-sm text-white truncate flex-1">{attachment.name}</span>
                                          <button
                                            onClick={() => window.open(attachment.url, '_blank')}
                                            className="text-cyan-400 hover:text-cyan-300 text-sm"
                                          >
                                            Download
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
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
                );
              } else if (messageSearchTerm) {
                return (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Search size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                      <p className="text-gray-400">No messages found</p>
                      <p className="text-sm text-gray-500">Try a different search term</p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                      <p className="text-gray-400">No messages yet</p>
                      <p className="text-sm text-gray-500">Send a message to start the conversation</p>
                    </div>
                  </div>
                );
              }
            })()}
            
            {/* Typing indicator */}
            {typingUsers.size > 0 && selectedConversation && typingUsers.has(selectedConversation.user.id) && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-tr-lg rounded-tl-lg rounded-br-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">{selectedConversation.user.full_name} is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-700">
              <div className="mb-2">
                <span className="text-sm text-gray-400">Attachments ({attachments.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div 
                    key={index}
                    className="bg-gray-700 border border-gray-600 rounded-lg p-2 flex items-center gap-2 max-w-xs"
                  >
                    {file.type.startsWith('image/') ? (
                      <div className="flex items-center gap-2">
                        <Image size={14} className="text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-white truncate">{file.name}</div>
                          <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <File size={14} className="text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-white truncate">{file.name}</div>
                          <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-white flex-shrink-0"
                      title="Remove attachment"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none"
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
                  >
                    <Paperclip size={18} />
                  </button>
                  
                  {showAttachmentOptions && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 flex flex-col gap-2 min-w-[150px]">
                      <button 
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachmentOptions(false);
                        }}
                        className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded text-left"
                      >
                        <Image size={16} className="text-cyan-400" />
                        <span>Image</span>
                      </button>
                      <button 
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachmentOptions(false);
                        }}
                        className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded text-left"
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
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
                  >
                    <Smile size={18} />
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2">
                      <div className="grid grid-cols-6 gap-2">
                        {['😊', '👍', '❤️', '😂', '🎉', '🔥', '👏', '🙏', '💯', '🚀', '✅', '❓'].map(emoji => (
                          <button 
                            key={emoji}
                            onClick={() => addEmoji(emoji)}
                            className="text-xl p-1 hover:bg-gray-700 rounded"
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
                  disabled={(!newMessage.trim() && attachments.length === 0) || sendingMessage}
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
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}