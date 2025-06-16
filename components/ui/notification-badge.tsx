'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface NotificationBadgeProps {
  userId: string;
}

export function NotificationBadge({ userId }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('read', false);
        
        if (error) {
          console.error('Error fetching unread count:', error);
          return;
        }
        
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

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
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        }, 
        (payload) => {
          if (payload.new.read && !payload.old.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, supabase]);

  return (
    <div className="relative">
      <Bell size={20} className="text-gray-400 hover:text-white transition-colors" />
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
}