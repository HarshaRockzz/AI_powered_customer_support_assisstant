import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
}

export default function Layout({ children, title, headerActions }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Chat', href: '/', icon: ChatBubbleLeftRightIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Sidebar */}
      <motion.div
        animate={{ width: sidebarOpen ? 248 : 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col overflow-hidden flex-shrink-0"
      >
        <div className="w-[248px] flex flex-col h-full">
          <div className="p-4 pb-5 flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <SparklesIcon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className="font-semibold text-[15px] gradient-text leading-tight">AI Support</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Admin Dashboard</div>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-[var(--radius-sm)]"
                      style={{
                        background: 'rgba(91, 140, 255, 0.12)',
                        border: '1px solid rgba(91, 140, 255, 0.2)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <item.icon className="w-[18px] h-[18px] relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[var(--border-primary)] mt-2">
            <div className="text-[11px] text-[var(--text-tertiary)]">
              <div className="font-semibold text-[var(--text-secondary)] mb-0.5">AI Support Assistant</div>
              <div>Powered by OpenRouter &amp; Next.js</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-[var(--border-primary)] flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-[var(--radius-sm)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold flex-1">{title}</div>
          <AnimatePresence>{headerActions}</AnimatePresence>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
