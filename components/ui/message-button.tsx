'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, Loader2, Send, X } from 'lucide-react';
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
  recipientName = 'User',
  recipientAvatar,
  projectId,
  className,
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
    
    setError(null);
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

  const handleOpenChat = () => {
    router.push('/messages');
  };

  if (variant === 'icon') {
    return (
      <>
        <button 
          onClick={() => setShowModal(true)}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium rounded-lg transition-all duration-200"
        >
          <MessageSquare size={16} />
        </button>
        
        {showModal && (
          <MessageModal 
            recipientName={recipientName}
            recipientAvatar={recipientAvatar}
            message={message}
            setMessage={setMessage}
            sending={sending}
            error={error}
            onSend={handleSendMessage}
            onClose={() => setShowModal(false)}
            onOpenChat={handleOpenChat}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className={cn(
          "bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
          className
        )}
      >
        <MessageSquare size={16} />
        Message
      </button>
      
      {showModal && (
        <MessageModal 
          recipientName={recipientName}
          recipientAvatar={recipientAvatar}
          message={message}
          setMessage={setMessage}
          sending={sending}
          error={error}
          onSend={handleSendMessage}
          onClose={() => setShowModal(false)}
          onOpenChat={handleOpenChat}
        />
      )}
    </>
  );
}

interface MessageModalProps {
  recipientName: string;
  recipientAvatar?: string;
  message: string;
  setMessage: (message: string) => void;
  sending: boolean;
  error: string | null;
  onSend: () => void;
  onClose: () => void;
  onOpenChat: () => void;
}

function MessageModal({
  recipientName,
  recipientAvatar,
  message,
  setMessage,
  sending,
  error,
  onSend,
  onClose,
  onOpenChat
}: MessageModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white/5 border border-white/20 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Message {recipientName}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Write a message to ${recipientName}...`}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none min-h-[120px]"
            disabled={sending}
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onSend}
            disabled={!message.trim() || sending}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <button
            onClick={onOpenChat}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          >
            Open Chat
          </button>
        </div>
      </div>
    </div>
  );
}