'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Zap } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export function EnhancedAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm your AI assistant with access to real-time project analysis and skill optimization algorithms. How can I help with your freelancing journey today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Processing your request...',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await fetch('/api/ai/mentor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          context: 'NexusWorks freelancing platform'
        }),
      });

      const data = await response.json();

      // Remove typing indicator and add real response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, {
          id: (Date.now() + 2).toString(),
          text: data.response || 'I encountered an issue processing your request. Please try again.',
          isUser: false,
          timestamp: new Date()
        }];
      });
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, {
          id: (Date.now() + 2).toString(),
          text: 'Sorry, I encountered an error. Please try your query again.',
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { text: "Analyze my skills", action: "skill-analysis" },
    { text: "Find project matches", action: "project-matching" },
    { text: "Generate learning path", action: "learning-path" },
    { text: "Price my project", action: "project-pricing" }
  ];

  const handleQuickAction = (action: string) => {
    const actionTexts = {
      "skill-analysis": "Can you analyze my current skills and suggest improvements?",
      "project-matching": "Find projects that match my skill set",
      "learning-path": "Create a personalized learning path for me",
      "project-pricing": "Help me price my next project"
    };
    
    setInputValue(actionTexts[action as keyof typeof actionTexts] || "");
  };

  return (
    <>
      <div 
        className="fixed bottom-4 left-4 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer z-50 hover:scale-110 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare size={20} className="text-white" />
      </div>

      {isOpen && (
        <div className="fixed bottom-20 left-4 w-80 bg-black/90 border border-cyan-500/30 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-3 border-b border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-400">AI Assistant</span>
              <div className="flex items-center gap-1">
                <Zap size={14} className="text-cyan-400" />
                <span className="text-xs text-cyan-400">Active</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`max-w-[90%] rounded-lg p-3 ${message.isUser ? 'bg-blue-500/20 ml-auto' : 'bg-white/10'}`}
              >
                {message.isTyping ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm opacity-70">{message.text}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-200">{message.text}</p>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-white/10">
            <div className="flex flex-wrap gap-1">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  className="text-xs px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full hover:bg-cyan-500/30 transition-colors"
                >
                  {action.text}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-3 border-t border-white/10 flex items-center gap-2">
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about projects, skills, or career guidance..."
              className="flex-1 bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white resize-none outline-none min-h-[40px] max-h-[80px] text-sm"
              rows={1}
              disabled={isLoading}
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} className="text-cyan-400" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}