'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Bell } from 'lucide-react';
import Link from 'next/link';

interface NotificationBadgeProps {
  userId: string;
}

export function NotificationBadge({ userId }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        // Count unread messages
        const { count: messageCount, error: messageError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('read', false);

        if (messageError) throw messageError;
        
        // Count unread notifications (project bids, etc.)
        // This would be expanded based on your notification system
        const totalUnread = messageCount || 0;
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    if (userId) {
      loadUnreadCount();
      
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
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [userId, supabase]);

  return (
    <Link href="/messages" className="relative">
      <Bell size={20} className="text-gray-400 hover:text-white transition-colors" />
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </Link>
  );
}