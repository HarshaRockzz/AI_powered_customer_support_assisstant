import React, { useState, KeyboardEvent } from 'react';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass border-t border-white/10 p-6">
      <div className="max-w-5xl mx-auto">
        <div className={`glass-dark rounded-2xl p-2 border transition-all duration-300 ${
          isFocused 
            ? 'border-purple-400 ring-4 ring-purple-400/20 shadow-2xl shadow-purple-500/20' 
            : 'border-white/10'
        }`}>
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Ask me anything... 💬"
                disabled={disabled}
                rows={1}
                className="w-full resize-none bg-transparent text-white placeholder-white/40 px-4 py-3 focus:outline-none disabled:cursor-not-allowed font-medium"
                style={{ 
                  minHeight: '52px', 
                  maxHeight: '200px',
                  lineHeight: '1.5'
                }}
              />
              {/* Character counter */}
              {message.length > 0 && (
                <div className="absolute bottom-2 right-3 text-xs text-white/40 font-mono">
                  {message.length}
                </div>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={disabled || !message.trim()}
              className={`relative overflow-hidden rounded-xl px-6 py-3 font-semibold text-white transition-all duration-300 flex items-center gap-2 group ${
                disabled || !message.trim()
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover-lift shadow-lg'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-opacity ${
                disabled || !message.trim() ? 'opacity-50' : 'opacity-100 group-hover:opacity-90'
              }`}></div>
              <PaperAirplaneIcon className="w-5 h-5 relative z-10 group-hover:rotate-45 transition-transform duration-300" />
              <span className="relative z-10">Send</span>
              <SparklesIcon className="w-4 h-4 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
        
        {/* Enhanced hints */}
        <div className="flex items-center justify-between mt-3 px-2">
          <div className="flex items-center gap-4 text-xs text-white/50 font-medium">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white/70">Enter</kbd>
              to send
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white/70">Shift+Enter</kbd>
              for new line
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <SparklesIcon className="w-3 h-3" />
            <span>Powered by AI</span>
          </div>
        </div>

        {/* Quick suggestions (optional) */}
        {message.length === 0 && !disabled && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setMessage('How can you help me?')}
              className="px-3 py-1.5 rounded-lg glass-dark border border-white/10 text-xs text-white/70 hover:text-white hover-lift font-medium transition-all"
            >
              💡 How can you help me?
            </button>
            <button
              onClick={() => setMessage('What are your capabilities?')}
              className="px-3 py-1.5 rounded-lg glass-dark border border-white/10 text-xs text-white/70 hover:text-white hover-lift font-medium transition-all"
            >
              🚀 What are your capabilities?
            </button>
            <button
              onClick={() => setMessage('Tell me about your services')}
              className="px-3 py-1.5 rounded-lg glass-dark border border-white/10 text-xs text-white/70 hover:text-white hover-lift font-medium transition-all"
            >
              📦 Tell me about your services
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
