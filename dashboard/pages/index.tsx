import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from '../components/Layout';
import Button from '../components/Button';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { submitFeedback, streamQuery, getModels, ModelOption } from '../lib/api';
import { getSessionId } from '../lib/utils';
import { PlusIcon, ChevronDownIcon, CpuChipIcon } from '@heroicons/react/24/outline';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
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

  const headerActions = (
    <motion.div
      key="chat-header-actions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      <Button variant="ghost" size="sm" icon={<PlusIcon className="w-4 h-4" />} onClick={newChat}>
        New chat
      </Button>

      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          icon={<CpuChipIcon className="w-4 h-4 text-[var(--accent-primary)]" />}
          onClick={() => setModelMenuOpen((v) => !v)}
        >
          {models.find((m) => m.id === selectedModel)?.label || 'Select model'}
          <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </Button>

        <AnimatePresence>
          {modelMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto surface shadow-[var(--shadow-lg)] z-20 p-1.5"
            >
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectModel(m.id)}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] transition-colors ${
                    m.id === selectedModel ? 'bg-[rgba(91,140,255,0.1)]' : ''
                  }`}
                >
                  <div className={`font-medium ${m.id === selectedModel ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {m.label}
                  </div>
                  <div className="text-[var(--text-tertiary)] mt-0.5">
                    {m.context_length.toLocaleString()} ctx · free
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <Layout title="Customer Support Chat" headerActions={headerActions}>
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onFeedback={handleFeedback}
                  onRegenerate={message.sourceQuery ? handleRegenerate : undefined}
                  isStreaming={loading && message.id === messages[messages.length - 1].id}
                />
              ))}
            </AnimatePresence>
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
    </Layout>
  );
}
