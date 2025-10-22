import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: 'chat' | 'analytics' | 'documents' | 'settings';
}

export default function Layout({ children, currentPage = 'chat' }: LayoutProps) {
  const router = useRouter();
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
  }, []);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon, path: '/', badge: null },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon, path: '/analytics', badge: null },
    { id: 'documents', label: 'Documents', icon: DocumentTextIcon, path: '/documents', badge: null },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, path: '/settings', badge: null },
  ];

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
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg hover-lift">
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full group relative overflow-hidden ${
                  isActive ? '' : 'hover-lift'
                }`}
              >
                {isActive ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-90 rounded-xl"></div>
                    <div className="relative flex items-center gap-3 px-4 py-3 text-white font-semibold">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      <RocketLaunchIcon className="w-4 h-4 ml-auto opacity-70" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-dark text-white/90 hover:text-white transition-all">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-purple-500/30 text-purple-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="p-4 rounded-xl glass-dark border border-white/10 mb-3">
            <h3 className="text-sm font-semibold text-white/70 mb-2">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Status</span>
                <span className="text-xs font-bold text-green-400">🟢 Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Model</span>
                <span className="text-xs font-semibold text-purple-300">Llama 3.3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Provider</span>
                <span className="text-xs font-semibold text-cyan-300">Groq</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-white/40 font-medium">
              © 2025 AI Support Assistant
            </p>
            <p className="text-xs text-white/30 mt-1">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {children}
      </div>
    </div>
  );
}

