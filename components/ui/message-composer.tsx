'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Send, Paperclip, Smile, Image, File, Loader2, X } from 'lucide-react';

interface MessageComposerProps {
  userId: string;
  recipientId: string;
  projectId?: string;
  onMessageSent?: () => void;
  placeholder?: string;
  className?: string;
}

export function MessageComposer({
  userId,
  recipientId,
  projectId,
  onMessageSent,
  placeholder = 'Type a message...',
  className = ''
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const sendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return;
    
    setSending(true);
    setError(null);
    
    try {
      // First, upload any attachments
      const uploadedFiles = [];
      
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `messages/${userId}/${fileName}`;
        
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
          type: file.type.startsWith('image/') ? 'image' : 'file'
        });
      }
      
      // Create message content with attachments
      let finalContent = message.trim();
      
      if (uploadedFiles.length > 0) {
        const attachmentText = uploadedFiles.map(file => 
          `[${file.type === 'image' ? 'Image' : 'File'}: ${file.name}](${file.url})`
        ).join('\n');
        
        finalContent = finalContent 
          ? `${finalContent}\n\n${attachmentText}`
          : attachmentText;
      }
      
      // Send the message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          project_id: projectId,
          content: finalContent,
          read: false
        });

      if (error) throw error;
      
      // Clear form
      setMessage('');
      setAttachments([]);
      
      // Notify parent
      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
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
    setAttachments(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className={`${className}`}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, index) => (
            <div 
              key={index}
              className="bg-white/10 border border-white/20 rounded-lg p-2 flex items-center gap-2"
            >
              {file.type.startsWith('image/') ? (
                <Image size={14} className="text-cyan-400" />
              ) : (
                <File size={14} className="text-cyan-400" />
              )}
              <span className="text-xs text-white truncate max-w-[150px]">{file.name}</span>
              <button 
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-2 p-2 bg-red-500/20 border border-red-500/40 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
      
      {/* Message Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full bg-white/10 border border-white/20 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none"
          rows={1}
        />
        
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          {/* File Attachment */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
            <button 
              onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5"
            >
              <Paperclip size={18} />
            </button>
            
            {showAttachmentOptions && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-white/20 rounded-lg shadow-xl p-2 flex flex-col gap-2 min-w-[150px]">
                <button 
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachmentOptions(false);
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-white/5 rounded text-left"
                >
                  <Image size={16} className="text-cyan-400" />
                  <span>Image</span>
                </button>
                <button 
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachmentOptions(false);
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-white/5 rounded text-left"
                >
                  <File size={16} className="text-cyan-400" />
                  <span>Document</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Emoji Picker */}
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
                      onClick={() => addEmoji(emoji)}
                      className="text-xl p-1 hover:bg-white/10 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Send Button */}
          <button 
            onClick={sendMessage}
            disabled={(!message.trim() && attachments.length === 0) || sending}
            className="p-2 bg-cyan-500/20 text-cyan-400 rounded-full hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}