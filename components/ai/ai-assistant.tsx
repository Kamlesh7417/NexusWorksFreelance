'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI mentor. How can I assist you with your projects today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputValue),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (input: string): string => {
    const responses = [
      "Based on your quantum programming skills, I recommend applying to the SecureFin encryption project. It matches your expertise perfectly!",
      "I notice you've been working on AI projects. Would you like me to suggest some advanced machine learning courses?",
      "Your profile shows strong growth in blockchain development. There are 3 new DeFi projects that could interest you.",
      "I can help you optimize your project timeline. Would you like me to analyze your current workload?",
      "Great question! Let me connect you with a mentor who specializes in that area."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      <div className="nexus-ai-assistant" onClick={() => setIsOpen(!isOpen)}>
        <Clock size={30} color="#ffffff" />
      </div>

      {isOpen && (
        <div className="nexus-ai-assistant-chat">
          <div className="nexus-chat-header">Quantum AI Assistant</div>
          <div className="nexus-chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`nexus-message ${message.isUser ? 'nexus-user-message' : 'nexus-ai-message'}`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="nexus-chat-input">
            <input 
              type="text" 
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={sendMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e6ff" strokeWidth="2">
                <path d="M22 2L11 13"></path>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}