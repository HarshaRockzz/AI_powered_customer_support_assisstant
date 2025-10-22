import React from 'react';
import ReactMarkdown from 'react-markdown';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid, HandThumbDownIcon as HandThumbDownIconSolid } from '@heroicons/react/24/solid';
import { UserIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ChatMessageProps {
  message: {
    id: string;
    query_id?: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    feedback?: number;
  };
  onFeedback?: (queryId: number, score: number) => void;
}

export default function ChatMessage({ message, onFeedback }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-3xl ${isUser ? 'ml-12' : 'mr-12'} w-full`}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {!isUser && (
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg ring-2 ring-white/20">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          )}

          <div className="flex-1">
            {/* Message Bubble */}
            <div
              className={`rounded-2xl px-5 py-4 shadow-2xl ${
                isUser
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white ml-auto hover-lift border border-white/20'
                  : 'glass text-white border border-white/20 hover-lift'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              ) : (
                <div className="markdown-content prose prose-invert max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
            
            {/* Feedback buttons for assistant messages */}
            {!isUser && message.query_id && onFeedback && (
              <div className="flex items-center gap-2 mt-3 ml-2">
                <button
                  onClick={() => onFeedback(message.query_id!, 1)}
                  className={`group p-2 rounded-lg glass-dark hover-lift border border-white/10 transition-all ${
                    message.feedback === 1 ? 'ring-2 ring-green-400' : ''
                  }`}
                  title="Helpful"
                >
                  {message.feedback === 1 ? (
                    <HandThumbUpIconSolid className="w-4 h-4 text-green-400" />
                  ) : (
                    <HandThumbUpIcon className="w-4 h-4 text-white/60 group-hover:text-green-400 transition-colors" />
                  )}
                </button>
                <button
                  onClick={() => onFeedback(message.query_id!, -1)}
                  className={`group p-2 rounded-lg glass-dark hover-lift border border-white/10 transition-all ${
                    message.feedback === -1 ? 'ring-2 ring-red-400' : ''
                  }`}
                  title="Not helpful"
                >
                  {message.feedback === -1 ? (
                    <HandThumbDownIconSolid className="w-4 h-4 text-red-400" />
                  ) : (
                    <HandThumbDownIcon className="w-4 h-4 text-white/60 group-hover:text-red-400 transition-colors" />
                  )}
                </button>
                <span className="text-xs text-white/50 ml-2 font-medium">Was this helpful?</span>
              </div>
            )}
            
            {/* Timestamp */}
            <p className="text-xs text-white/50 mt-2 ml-2 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>

          {/* User Avatar */}
          {isUser && (
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg ring-2 ring-white/20">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
