import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { submitQuery, submitFeedback } from '../lib/api';
import { getSessionId } from '../lib/utils';
import { 
  Bars3Icon,
  PlusIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  query_id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: number;
}

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getSessionId());
    // Add welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your AI Support Assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitMessage = async (content: string) => {
    if (!sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await submitQuery({
        query: content,
        session_id: sessionId,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        query_id: response.query_id,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to submit query:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, score: number) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.query_id) return;

    try {
      await submitFeedback({
        query_id: message.query_id,
        session_id: sessionId,
        score,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: score } : m))
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const newChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your AI Support Assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-[var(--border-primary)]">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded-lg transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-hover)] text-[var(--text-primary)]"
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => router.push('/analytics')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => router.push('/documents')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span>Documents</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[var(--border-primary)]">
          <div className="text-xs text-[var(--text-tertiary)]">
            <div className="font-semibold text-[var(--text-primary)] mb-1">AI Support Assistant</div>
            <div>Powered by Groq & Next.js</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-[var(--border-primary)] flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="text-sm font-medium">Customer Support Chat</div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onFeedback={handleFeedback}
              />
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="spinner"></div>
                    <span className="text-sm text-[var(--text-secondary)]">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border-primary)] p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSubmit={handleSubmitMessage}
              disabled={loading}
            />
            <div className="mt-2 text-xs text-center text-[var(--text-tertiary)]">
              AI can make mistakes. Consider checking important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
