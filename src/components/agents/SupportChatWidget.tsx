/**
 * Support Chat Widget - React component powered by LangGraph support agent
 */

import React, { useState, useEffect, useRef } from 'react';
import { supportChatbotAgent } from '../../lib/agents/support-chatbot-agent';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  needsEscalation?: boolean;
  suggestions?: string[];
}

interface SupportChatWidgetProps {
  initialOpen?: boolean;
  onEscalation?: (sessionId: string, messages: ChatMessage[]) => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'embedded';
  userProfile?: {
    location?: string;
    monthlyUsage?: number;
    currentProvider?: string;
  };
}

export const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({
  initialOpen = false,
  onEscalation,
  className = '',
  position = 'bottom-right',
  userProfile,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationStage, setConversationStage] = useState('greeting');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial greeting message
      const greetingMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `Hello! 👋 I'm your electricity plan assistant. I can help you with:

🔍 **Finding the best plan** for your needs
⚡ **Switching providers** and signup help  
💡 **Understanding your bill** and charges
❓ **General questions** about Texas electricity

What can I help you with today?`,
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          "Help me find the best electricity plan",
          "I need help switching providers",
          "I have questions about my electricity bill",
          "How does the Texas electricity market work?"
        ],
      };
      
      setMessages([greetingMessage]);
      setSuggestions(greetingMessage.suggestions || []);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || inputMessage.trim();
    if (!message || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setSuggestions([]);

    try {
      const response = await supportChatbotAgent.chat(message, sessionId, userProfile);
      
      setSessionId(response.sessionId);
      setConversationStage(response.conversationStage);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
        needsEscalation: response.needsEscalation,
        suggestions: response.suggestions,
      };

      setMessages(prev => [...prev, botMessage]);
      setSuggestions(response.suggestions || []);

      // Handle escalation
      if (response.needsEscalation) {
        setTimeout(() => {
          onEscalation?.(response.sessionId, [...messages, userMessage, botMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact our support team directly if the issue persists.",
        isUser: false,
        timestamp: new Date(),
        needsEscalation: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    handleSendMessage(suggestion);
  };

  const formatMessageContent = (content: string) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded text-sm"><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />');
  };

  const ChatHeader = () => (
    <div className="bg-texas-navy text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-texas-red rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">AI</span>
        </div>
        <div>
          <h3 className="font-semibold">Electricity Assistant</h3>
          <p className="text-xs text-blue-200">
            {isTyping ? 'Typing...' : 'Online • Powered by AI'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white hover:text-blue-200 transition-colors"
          title="Minimize"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-blue-200 transition-colors"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${message.isUser ? 'order-1' : 'order-2'}`}>
        {!message.isUser && (
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 bg-texas-red rounded-full flex items-center justify-center">
              <span className="text-white text-xs">AI</span>
            </div>
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        
        <div
          className={`p-3 rounded-lg ${
            message.isUser
              ? 'bg-texas-red text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}
        >
          <div 
            className="text-sm whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
          />
          
          {message.needsEscalation && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
              <span className="font-medium">⚠️ Escalation Needed:</span> This conversation may benefit from human assistance.
            </div>
          )}
        </div>
        
        {message.isUser && (
          <div className="text-xs text-gray-500 text-right mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );

  const SuggestionButtons = () => (
    suggestions.length > 0 && (
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border text-gray-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )
  );

  const ChatInput = () => (
    <div className="border-t p-4">
      <div className="flex space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about electricity plans..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-texas-red focus:border-texas-red disabled:opacity-50"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2 bg-texas-red text-white rounded-lg hover:bg-texas-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      
      {isLoading && (
        <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-texas-red"></div>
          <span>AI is thinking...</span>
        </div>
      )}
    </div>
  );

  if (position === 'embedded') {
    return (
      <div className={`support-chat-widget-embedded ${className}`}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-2xl mx-auto">
          <ChatHeader />
          {!isMinimized && (
            <>
              <div className="h-96 overflow-y-auto p-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
              <SuggestionButtons />
              <ChatInput />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed z-50 w-14 h-14 bg-texas-red hover:bg-texas-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110 ${
            position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
          }`}
          title="Open chat support"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 w-80 h-96 bg-white rounded-xl shadow-2xl border border-gray-200 ${
            position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
          } ${className}`}
        >
          <ChatHeader />
          
          {!isMinimized && (
            <>
              <div className="h-64 overflow-y-auto p-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <SuggestionButtons />
              <ChatInput />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;