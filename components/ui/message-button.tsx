'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageButtonProps {
  userId: string;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  projectId?: string;
  className?: string;
  variant?: 'default' | 'icon';
}

export function MessageButton({
  userId,
  recipientId,
  recipientName,
  recipientAvatar,
  projectId,
  className,
  variant = 'default'
}: MessageButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          project_id: projectId,
          content: message.trim(),
          read: false
        });

      if (error) throw error;
      
      // Close modal and reset message
      setShowModal(false);
      setMessage('');
      
      // Navigate to messages page
      router.push('/messages');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClick = () => {
    if (variant === 'default') {
      setShowModal(true);
    } else {
      // For icon variant, go directly to messages
      router.push('/messages');
    }
  };

  return (
    <>
      {variant === 'default' ? (
        <button
          onClick={handleClick}
          className={cn("flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200", className)}
        >
          <MessageSquare size={16} />
          Message
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={cn("p-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium rounded-lg transition-all duration-200", className)}
        >
          <MessageSquare size={16} />
        </button>
      )}

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-6 max-w-md w-[90%]">
            <div className="flex items-center gap-3 mb-4">
              {recipientAvatar ? (
                <img 
                  src={recipientAvatar} 
                  alt={recipientName || 'Recipient'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <span className="text-cyan-400 font-bold">
                    {recipientName ? recipientName.charAt(0) : 'U'}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-white">
                  Message to {recipientName || 'User'}
                </h3>
                {projectId && (
                  <p className="text-xs text-gray-400">
                    Regarding Project
                  </p>
                )}
              </div>
            </div>
            
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none min-h-[120px]"
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-medium py-2 px-4 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}