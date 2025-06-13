'use client';

import { useState } from 'react';

export function BCIPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [theme, setTheme] = useState('default');

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    const body = document.body;
    body.className = body.className.replace(/neural-theme-\w+/g, '');
    if (newTheme !== 'default') {
      body.classList.add(`neural-theme-${newTheme}`);
    }
  };

  const toggleLayout = (layout: string) => {
    alert(`Layout changed to: ${layout}`);
  };

  return (
    <>
      <button 
        className="fixed top-20 right-4 bg-cyan-500/20 border border-cyan-500/40 text-white px-3 py-2 rounded-lg text-sm z-50"
        onClick={() => setIsVisible(!isVisible)}
      >
        BCI Panel
      </button>

      {isVisible && (
        <div className="nexus-bci-panel">
          <h3>Neural Interface (BCI)</h3>
          <div className="nexus-bci-option" onClick={() => changeTheme('default')}>
            Default Theme
          </div>
          <div className="nexus-bci-option" onClick={() => changeTheme('light')}>
            Light Theme
          </div>
          <div className="nexus-bci-option" onClick={() => changeTheme('dark')}>
            Dark Theme
          </div>
          <div className="nexus-bci-option" onClick={() => toggleLayout('compact')}>
            Compact Layout
          </div>
          <div className="nexus-bci-option" onClick={() => alert('BCI Calibration opened')}>
            Calibrate BCI
          </div>
        </div>
      )}
    </>
  );
}