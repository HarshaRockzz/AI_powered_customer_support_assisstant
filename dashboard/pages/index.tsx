import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { submitQuery, submitFeedback } from '../lib/api';
import { getSessionId } from '../lib/utils';
import { 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  SparklesIcon,
  RocketLaunchIcon
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 100 + 50,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 6,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(newParticles);

    setSessionId(getSessionId());
    // Add welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '👋 Hello! I\'m your **AI-Powered Support Assistant**. How can I help you today?\n\nI can assist with:\n- Product information\n- Technical support\n- General inquiries\n- And much more!',
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

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Submit query to backend
      const response = await submitQuery({
        query: content,
        session_id: sessionId,
      });

      // Add assistant response
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
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (queryId: number, score: number) => {
    try {
      await submitFeedback({
        query_id: queryId,
        session_id: sessionId,
        score,
      });

      // Update message feedback
      setMessages((prev) =>
        prev.map((msg) =>
          msg.query_id === queryId ? { ...msg, feedback: score } : msg
        )
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle absolute rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Glassmorphic Sidebar */}
      <div className="w-80 flex flex-col glass border-r border-white/20 z-10 relative">
        {/* Logo Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                AI Support
              </h1>
              <p className="text-sm text-white/70 font-medium">Powered by Groq</p>
            </div>
          </div>
          <div className="mt-3 px-3 py-2 rounded-lg glass-dark">
            <p className="text-xs text-white/60 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online & Ready
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => router.push('/')}
            className="w-full group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-90 rounded-xl"></div>
            <div className="relative flex items-center gap-3 px-4 py-3 text-white font-semibold">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>Chat</span>
              <RocketLaunchIcon className="w-4 h-4 ml-auto opacity-70" />
            </div>
          </button>
          
          <button
            onClick={() => router.push('/analytics')}
            className="w-full group hover-lift"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-dark text-white/90 hover:text-white transition-all">
              <ChartBarIcon className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/documents')}
            className="w-full group hover-lift"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-dark text-white/90 hover:text-white transition-all">
              <DocumentTextIcon className="w-5 h-5" />
              <span className="font-medium">Documents</span>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/settings')}
            className="w-full group hover-lift"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-dark text-white/90 hover:text-white transition-all">
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </div>
          </button>

          {/* Stats Card */}
          <div className="mt-6 p-4 rounded-xl glass-dark border border-white/10">
            <h3 className="text-sm font-semibold text-white/70 mb-3">Session Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Messages</span>
                <span className="text-sm font-bold text-white">{messages.length - 1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Model</span>
                <span className="text-xs font-semibold text-purple-300">Llama 3.3</span>
              </div>
            </div>
          </div>
        </nav>

        {/* New Conversation Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  content: '👋 Hello! I\'m your **AI-Powered Support Assistant**. How can I help you today?\n\nI can assist with:\n- Product information\n- Technical support\n- General inquiries\n- And much more!',
                  timestamp: new Date(),
                },
              ]);
              setSessionId(getSessionId());
            }}
            className="w-full px-4 py-3 rounded-xl font-semibold text-white hover-lift relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative">✨ New Conversation</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Glassmorphic Chat Header */}
        <div className="glass border-b border-white/10 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Customer Support Chat
              </h2>
              <p className="text-sm text-white/70 font-medium">
                Ask me anything about your product or service
              </p>
            </div>
            <div className="px-4 py-2 rounded-full glass-dark border border-white/20">
              <p className="text-sm font-semibold text-white/90">
                🤖 AI Assistant
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area with Glassmorphic Container */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {messages.map((message, index) => (
              <div key={message.id} className="message-enter">
                <ChatMessage
                  message={message}
                  onFeedback={handleFeedback}
                />
              </div>
            ))}
            
            {/* Enhanced Typing Indicator */}
            {loading && (
              <div className="flex justify-start mb-4 message-enter">
                <div className="max-w-3xl">
                  <div className="glass-dark rounded-2xl px-6 py-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-purple-400 rounded-full typing-dot"></div>
                        <div className="w-2.5 h-2.5 bg-pink-400 rounded-full typing-dot" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2.5 h-2.5 bg-blue-400 rounded-full typing-dot" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-sm text-white/70 font-medium">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput onSubmit={handleSubmitMessage} disabled={loading} />
      </div>
    </div>
  );
}
