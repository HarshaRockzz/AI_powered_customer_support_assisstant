import React from 'react';
import { HandThumbUpIcon, HandThumbDownIcon, UserIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid';

interface Message {
  id: string;
  query_id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: number;
}

interface ChatMessageProps {
  message: Message;
  onFeedback?: (messageId: string, score: number) => void;
}

export default function ChatMessage({ message, onFeedback }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`mb-6 animate-fade-in ${isUser ? 'flex justify-end' : ''}`}>
      <div className={`flex gap-3 max-w-full ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser 
            ? 'bg-[var(--accent-primary)]' 
            : 'bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
        }`}>
          {isUser ? (
            <UserIcon className="w-5 h-5 text-white" />
          ) : (
            <div className="w-5 h-5 flex items-center justify-center text-[var(--accent-primary)] font-bold text-sm">
              AI
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
          }`}>
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>

          {/* Feedback Buttons (only for assistant messages) */}
          {!isUser && onFeedback && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onFeedback(message.id, 1)}
                className={`p-1.5 rounded transition-colors ${
                  message.feedback === 1
                    ? 'text-[var(--accent-success)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
                title="Good response"
              >
                {message.feedback === 1 ? (
                  <HandThumbUpSolid className="w-4 h-4" />
                ) : (
                  <HandThumbUpIcon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onFeedback(message.id, 0)}
                className={`p-1.5 rounded transition-colors ${
                  message.feedback === 0
                    ? 'text-[var(--accent-danger)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
                title="Bad response"
              >
                {message.feedback === 0 ? (
                  <HandThumbDownSolid className="w-4 h-4" />
                ) : (
                  <HandThumbDownIcon className="w-4 h-4" />
                )}
              </button>
              <span className="text-xs text-[var(--text-tertiary)] ml-1">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
