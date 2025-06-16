'use client';

import { useState, useEffect } from 'react';

export function NotificationBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  const messages = [
    "New project available! Perfect match for your expertise.",
    "Your learning progress is excellent. Consider taking on a mentorship role.",
    "3 new collaboration requests from top-rated clients. Check your inbox!"
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

    const interval = setInterval(showNotification, 15000);
    
    // Show first notification after 3 seconds
    setTimeout(showNotification, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/40 p-4 rounded-lg max-w-md shadow-xl z-50 animate-fadeIn backdrop-blur-sm">
      <h3 className="font-semibold text-cyan-400 mb-1">AI Assistant Suggestion</h3>
      <p className="text-sm text-gray-300">{message}</p>
    </div>
  );
}