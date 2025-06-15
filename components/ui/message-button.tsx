'use client';

import { useState } from 'react';
import { MessageSquare, Loader2, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';

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
  className,
  variant = 'default'
}: MessageButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
      
      setSuccess(true);
      setMessage('');
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
      }, 1500);
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
          className={cn(
            "p-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium rounded-lg transition-all duration-200",
            className
          )}
        >
          <MessageSquare size={16} />
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className={cn(
            "bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
            className
          )}
        >
          <MessageSquare size={16} />
          Message {recipientName.split(' ')[0]}
        </button>
      )}

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Message {recipientName}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3 mb-4">
                <p className="text-green-400 text-sm">Message sent successfully!</p>
              </div>
            )}

            <div className="mb-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Write a message to ${recipientName}...`}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 min-h-[120px] resize-none"
                disabled={sending || success}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending || success}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : success ? (
                  'Sent!'
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}