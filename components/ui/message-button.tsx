'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { MessagePreview } from './message-preview';

interface MessageButtonProps {
  userId: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  projectId?: string;
  variant?: 'icon' | 'button' | 'link';
  className?: string;
}

export function MessageButton({ 
  userId, 
  recipientId, 
  recipientName, 
  recipientAvatar,
  projectId,
  variant = 'button',
  className = ''
}: MessageButtonProps) {
  const [showMessagePreview, setShowMessagePreview] = useState(false);

  if (userId === recipientId) {
    return null; // Don't show message button for yourself
  }

  return (
    <>
      {variant === 'icon' && (
        <button
          onClick={() => setShowMessagePreview(true)}
          className={`p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors ${className}`}
        >
          <MessageSquare size={16} className="text-cyan-400" />
        </button>
      )}
      
      {variant === 'button' && (
        <button
          onClick={() => setShowMessagePreview(true)}
          className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 ${className}`}
        >
          <MessageSquare size={16} className="text-cyan-400" />
          Message
        </button>
      )}
      
      {variant === 'link' && (
        <button
          onClick={() => setShowMessagePreview(true)}
          className={`text-cyan-400 hover:text-cyan-300 font-medium ${className}`}
        >
          Send Message
        </button>
      )}
      
      {showMessagePreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <MessagePreview
            userId={userId}
            projectId={projectId}
            recipientId={recipientId}
            recipientName={recipientName}
            recipientAvatar={recipientAvatar}
            onClose={() => setShowMessagePreview(false)}
          />
        </div>
      )}
    </>
  );
}