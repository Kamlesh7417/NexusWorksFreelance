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

export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed - new version available');
      });
      
      // Check for updates every hour
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update();
          }
        });
      }, 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  const sendBackgroundSync = async (tag: string) => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        return true;
      } catch (error) {
        console.error('Background sync failed:', error);
        return false;
      }
    }
    return false;
  };
  
  return { sendBackgroundSync };
}