
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { marked } from 'marked';
import { loggedInUser } from '../data';
import { Kernel } from '../services/AetheriusKernel';

export const SimpleAIChat: React.FC = () => {
  const identity = loggedInUser.systemIdentity;
  const aiName = identity?.aiNickname || identity?.aiCoreName || 'Aether';

  // Load history from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
      try {
          const saved = localStorage.getItem('aetherius_simple_chat_history');
          if (saved) {
              return JSON.parse(saved);
          }
      } catch (e) {
          console.error("Failed to load simple chat history", e);
      }
      // Default initial message if no history
      return [{ role: 'model', text: Kernel.getDynamicGreeting(loggedInUser) }];
  });

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persist history on change
  useEffect(() => {
      try {
          localStorage.setItem('aetherius_simple_chat_history', JSON.stringify(messages));
      } catch (e) {
          console.error("Failed to save chat history", e);
      }
  }, [messages]);

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // Process via Internal Kernel
      const responseStream = await Kernel.processInput(currentInput, {
          user: loggedInUser
      });

      let currentText = '';
      setMessages(prev => [...prev, { role: 'model', text: '...' }]);

      for await (const chunk of responseStream) {
        currentText = chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = currentText;
          return newMessages;
        });
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = `Core Error: ${e.message}`;
      setError(errorMessage);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = errorMessage;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-between items-center">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{aiName} (AI Assistant)</h2>
          <button 
            onClick={() => {
                setMessages([{ role: 'model', text: Kernel.getDynamicGreeting(loggedInUser) }]);
                localStorage.removeItem('aetherius_simple_chat_history');
            }}
            className="text-xs text-gray-500 hover:text-red-500"
            title="Clear History"
          >
              Clear
          </button>
      </header>
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-gray-800 dark:bg-gray-900 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(msg.text) as string }} />
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].role === 'user' && (
           <div className="flex justify-start">
             <div className="max-w-xs p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-1 focus-within:ring-blue-500">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${aiName}...`}
            disabled={isLoading}
            className="w-full bg-transparent p-2 focus:outline-none text-gray-800 dark:text-gray-200 text-sm disabled:opacity-50"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};
