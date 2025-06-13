'use client';

import { useState, useEffect } from 'react';

export function NotificationBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  const messages = [
    "I'm detecting high focus. Would you like to join a project now? Your skill match is 92%.",
    "New quantum computing project available! Perfect match for your expertise.",
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
    <div className="nexus-notification-bar">
      <h3>AI Mentor Suggestion</h3>
      <p>{message}</p>
    </div>
  );
}