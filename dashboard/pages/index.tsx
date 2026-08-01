import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { submitFeedback, streamQuery, getModels, ModelOption } from '../lib/api';
import { getSessionId } from '../lib/utils';
import {
  Bars3Icon,
  PlusIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  query_id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: number;
  sourceQuery?: string;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello! I\'m your AI Support Assistant. How can I help you today?',
  timestamp: new Date(),
};

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getSessionId());
    setMessages([WELCOME_MESSAGE]);

    const storedModel = typeof window !== 'undefined' ? localStorage.getItem('selected_model') : null;
    if (storedModel) setSelectedModel(storedModel);

    getModels()
      .then((res) => {
        setModels(res.models || []);
        if (!storedModel && res.default_model) {
          setSelectedModel(res.default_model);
        }
      })
      .catch((error) => console.error('Failed to load models:', error));
  }, []);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setModelMenuOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_model', modelId);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const runStream = async (query: string) => {
    if (!sessionId) return;
    setLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        sourceQuery: query,
      },
    ]);

    try {
      await streamQuery(
        { query, session_id: sessionId, model: selectedModel || undefined },
        (token) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m))
          );
        },
        () => {
          setLoading(false);
        },
        (error) => {
          console.error('Failed to stream query:', error);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content || 'Sorry, I encountered an error processing your request. Please try again.' }
                : m
            )
          );
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to submit query:', error);
      setLoading(false);
    }
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
    await runStream(content);
  };

  const handleRegenerate = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.sourceQuery) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    await runStream(message.sourceQuery);
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
            <div>Powered by OpenRouter & Next.js</div>
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

          <div className="ml-auto relative">
            <button
              onClick={() => setModelMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="font-medium">
                {models.find((m) => m.id === selectedModel)?.label || 'Select model'}
              </span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>

            {modelMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-10 animate-fade-in">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectModel(m.id)}
                    className={`w-full text-left px-3 py-2.5 text-xs hover:bg-[var(--bg-hover)] transition-colors ${
                      m.id === selectedModel ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="font-medium">{m.label}</div>
                    <div className="text-[var(--text-tertiary)]">{m.context_length.toLocaleString()} ctx · free</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onFeedback={handleFeedback}
                onRegenerate={message.sourceQuery ? handleRegenerate : undefined}
                isStreaming={loading && message.id === messages[messages.length - 1].id}
              />
            ))}
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
