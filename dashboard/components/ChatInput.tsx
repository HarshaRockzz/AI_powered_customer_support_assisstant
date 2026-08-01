import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className="rounded-[var(--radius-lg)] transition-all duration-200"
        style={{
          boxShadow: focused
            ? '0 0 0 3px rgba(91, 140, 255, 0.14), var(--shadow-md)'
            : 'var(--shadow-sm)',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder="Send a message..."
          rows={1}
          className="w-full resize-none bg-[var(--bg-tertiary)] text-[var(--text-primary)] border rounded-[var(--radius-lg)] px-4 py-3.5 pr-14 focus:outline-none placeholder-[var(--text-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          style={{
            minHeight: '54px',
            maxHeight: '200px',
            borderColor: focused ? 'var(--border-focus)' : 'var(--border-primary)',
          }}
        />
      </div>
      <motion.button
        type="submit"
        disabled={!input.trim() || disabled}
        whileHover={input.trim() && !disabled ? { scale: 1.05 } : undefined}
        whileTap={input.trim() && !disabled ? { scale: 0.92 } : undefined}
        className="absolute right-2.5 bottom-2.5 p-2.5 text-white rounded-[var(--radius-sm)] disabled:opacity-40 disabled:cursor-not-allowed transition-shadow"
        style={{
          background: input.trim() && !disabled ? 'var(--gradient-brand)' : 'var(--bg-hover)',
          boxShadow: input.trim() && !disabled ? 'var(--shadow-glow)' : 'none',
        }}
      >
        <PaperAirplaneIcon className="w-4.5 h-4.5" style={{ width: 17, height: 17 }} />
      </motion.button>
    </form>
  );
}
