'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MessageButtonProps {
  userId: string;
  recipientId: string;
  recipientName: string;
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
  className = '',
  variant = 'default'
}: MessageButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    setError(null);
    
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
      
      // Close modal and redirect to messages page
      setShowModal(false);
      router.push('/messages');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setShowModal(true)}
          className={`bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 ${className}`}
        >
          <MessageSquare size={16} />
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className={`bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${className}`}
        >
          <MessageSquare size={16} />
          Message
        </button>
      )}

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {recipientAvatar ? (
                  <img 
                    src={recipientAvatar} 
                    alt={recipientName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <span className="text-cyan-400 font-semibold">
                      {recipientName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">Message {recipientName}</h3>
                  {projectId && (
                    <p className="text-xs text-gray-400">Regarding Project</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none min-h-[120px]"
              />
              
              {error && (
                <div className="mt-2 text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sending}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}