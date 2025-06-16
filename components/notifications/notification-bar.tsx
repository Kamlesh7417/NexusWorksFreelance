'use client';

import { useState, useEffect } from 'react';
import { Bell, Info } from 'lucide-react';

export function NotificationBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  const messages = [
    "New project matching your skills has been posted! Check it out now.",
    "Your profile is 85% complete. Add your portfolio to increase visibility.",
    "3 new collaboration requests from top-rated clients. Check your inbox!",
    "Trending skill: React Native developers are in high demand this month."
  ];

  useEffect(() => {
    const showNotification = () => {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setMessage(randomMessage);
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    };

    const interval = setInterval(showNotification, 30000);
    
    // Show first notification after 5 seconds
    setTimeout(showNotification, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-20 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/40 p-4 rounded-lg max-w-md shadow-lg backdrop-blur-md z-50 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Info size={20} className="text-cyan-400 mt-0.5" />
        <div>
          <h3 className="font-semibold text-cyan-400 mb-1">NexusWorks Update</h3>
          <p className="text-sm text-gray-200">{message}</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white p-1"
        >
          &times;
        </button>
      </div>
    </div>
  );
}