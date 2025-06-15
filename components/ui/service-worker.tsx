'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker is installed but waiting to activate
                    showUpdateNotification();
                  }
                });
              }
            });
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
          
        // Handle service worker updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker controller changed - page will reload');
          window.location.reload();
        });
      });
      
      // Request notification permission for PWA
      if ('Notification' in window && Notification.permission === 'default') {
        // Wait for user interaction before requesting permission
        const requestPermission = () => {
          Notification.requestPermission();
          // Remove event listeners after first interaction
          document.removeEventListener('click', requestPermission);
          document.removeEventListener('keydown', requestPermission);
        };
        
        document.addEventListener('click', requestPermission);
        document.addEventListener('keydown', requestPermission);
      }
    }
  }, []);
  
  // Function to show update notification
  const showUpdateNotification = () => {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-4 bg-white/10 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-4 shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-cyan-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-medium text-white">Update Available</h3>
          <p class="text-sm text-gray-300">A new version is available. Refresh to update.</p>
        </div>
        <button id="update-app" class="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-3 py-1 rounded-lg text-sm">
          Update
        </button>
        <button id="dismiss-update" class="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listeners
    document.getElementById('update-app')?.addEventListener('click', () => {
      window.location.reload();
    });
    
    document.getElementById('dismiss-update')?.addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      notification.remove();
    }, 10000);
  };

  return null;
}