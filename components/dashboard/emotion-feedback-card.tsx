'use client';

import { useState } from 'react';

export function EmotionFeedbackCard() {
  const [emotionPosition, setEmotionPosition] = useState({ x: 50, y: 50 });

  const simulateEmotionChange = () => {
    const emotions = [
      { x: 20, y: 80 }, // Stress
      { x: 40, y: 70 }, // Frustration  
      { x: 60, y: 30 }, // Calm
      { x: 80, y: 20 }, // Focused
      { x: 90, y: 40 }  // Excited
    ];
    
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    setEmotionPosition(randomEmotion);
  };

  return (
    <div className="nexus-card">
      <h2>Emotion Feedback</h2>
      <p>AI monitors your emotional state for optimal productivity.</p>
      <div className="nexus-emotion-feedback">
        <div className="nexus-emotion-wheel">
          <div 
            className="nexus-emotion-indicator"
            style={{
              left: `${emotionPosition.x}%`,
              top: `${emotionPosition.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          ></div>
        </div>
        <div className="nexus-emotion-labels">
          <span>Stress</span>
          <span>Frustration</span>
          <span>Calm</span>
          <span>Focused</span>
          <span>Excited</span>
        </div>
        <button className="nexus-action-btn mt-4" onClick={simulateEmotionChange}>
          Simulate Change
        </button>
      </div>
    </div>
  );
}