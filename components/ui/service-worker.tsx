'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            
            // Request notification permission
            if (Notification.permission === 'default') {
              Notification.requestPermission();
            }
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}