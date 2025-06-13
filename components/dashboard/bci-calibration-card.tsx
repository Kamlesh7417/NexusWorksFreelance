'use client';

import { useState, useEffect } from 'react';

export function BCICalibrationCard() {
  const [signalBars, setSignalBars] = useState(Array(10).fill(0));
  const [calibrationStatus, setCalibrationStatus] = useState('Signal: Disconnected');
  const [isCalibrating, setIsCalibrating] = useState(false);

  const calibrateBCI = () => {
    setIsCalibrating(true);
    setCalibrationStatus('Calibrating...');
    
    const interval = setInterval(() => {
      setSignalBars(prev => prev.map(() => Math.random() * 100));
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setIsCalibrating(false);
      setCalibrationStatus('Signal: Connected');
      setSignalBars(Array(10).fill(75));
    }, 3000);
  };

  const mapControl = (type: string) => {
    alert(`Mapped BCI control: ${type}`);
  };

  return (
    <div className="nexus-card">
      <h2>Neural Interface</h2>
      <p>Calibrate your BCI for seamless brain-to-platform interaction.</p>
      <div className="w-full">
        <div className="w-full h-[150px] bg-black/30 border border-cyan-500/40 rounded-lg mt-2 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="flex h-[100px] w-4/5 items-end justify-center gap-1">
            {signalBars.map((height, index) => (
              <div 
                key={index}
                className="w-full bg-cyan-500/20 transition-all duration-100 rounded-sm"
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
          <div className="absolute bottom-2 text-cyan-400 text-sm">
            {calibrationStatus}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <button 
            className="nexus-bci-option text-xs px-3 py-1" 
            onClick={calibrateBCI}
            disabled={isCalibrating}
          >
            {isCalibrating ? 'Calibrating...' : 'Calibrate Signal'}
          </button>
          <button 
            className="nexus-bci-option text-xs px-3 py-1" 
            onClick={() => mapControl('navigate')}
          >
            Map: Navigate
          </button>
          <button 
            className="nexus-bci-option text-xs px-3 py-1" 
            onClick={() => mapControl('select')}
          >
            Map: Select
          </button>
        </div>
      </div>
      <button className="nexus-action-btn">Advanced Setup</button>
    </div>
  );
}