import React, { useState } from 'react';
import Layout from '../components/Layout';
import { 
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  BoltIcon,
  KeyIcon,
  ServerIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const settingsSections = [
    {
      id: 'general',
      title: 'General Settings',
      icon: Cog6ToothIcon,
      color: 'from-blue-500 to-cyan-500',
      settings: [
        {
          label: 'Enable Notifications',
          description: 'Receive notifications for important events',
          value: notifications,
          onChange: setNotifications,
        },
        {
          label: 'Sound Effects',
          description: 'Play sound effects for interactions',
          value: soundEffects,
          onChange: setSoundEffects,
        },
        {
          label: 'Auto-save',
          description: 'Automatically save your conversations',
          value: autoSave,
          onChange: setAutoSave,
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: PaintBrushIcon,
      color: 'from-purple-500 to-pink-500',
      settings: [
        {
          label: 'Dark Mode',
          description: 'Use dark theme across the application',
          value: darkMode,
          onChange: setDarkMode,
        },
      ],
    },
  ];

  const systemInfo = [
    { label: 'Version', value: '1.0.0', icon: BoltIcon, color: 'text-blue-400' },
    { label: 'Backend API', value: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080', icon: ServerIcon, color: 'text-purple-400' },
    { label: 'LLM Provider', value: 'Groq (Llama 3.3 70B)', icon: GlobeAltIcon, color: 'text-cyan-400' },
    { label: 'Status', value: '🟢 Active', icon: CheckCircleIcon, color: 'text-green-400' },
  ];

  return (
    <Layout currentPage="settings">
      {/* Header */}
      <div className="glass border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              <Cog6ToothIcon className="w-8 h-8 text-purple-400" />
              Settings
            </h1>
            <p className="text-white/70 font-medium">
              Configure your AI assistant preferences
            </p>
          </div>
          <div className="px-5 py-3 rounded-xl glass-dark border border-white/20">
            <p className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-green-400" />
              Secured
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Settings Sections */}
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="glass rounded-2xl border border-white/10 overflow-hidden hover-lift">
                {/* Section Header */}
                <div className={`px-6 py-5 border-b border-white/10 bg-gradient-to-r ${section.color} bg-opacity-10`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${section.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">{section.title}</h2>
                  </div>
                </div>

                {/* Settings List */}
                <div className="p-6 space-y-4">
                  {section.settings.map((setting, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl glass-dark border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{setting.label}</h3>
                        <p className="text-white/60 text-sm">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => setting.onChange(!setting.value)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                          setting.value ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                            setting.value ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* System Information */}
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <ServerIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">System Information</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {systemInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl glass-dark border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${info.color}`} />
                      <span className="text-white/60 font-medium">{info.label}</span>
                    </div>
                    <span className="text-white font-semibold">{info.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* API Keys Section */}
          <div className="glass rounded-2xl border border-white/10 overflow-hidden hover-lift">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-orange-500 to-red-500 bg-opacity-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                  <KeyIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">API Configuration</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 font-medium mb-2">Groq API Key</label>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      placeholder="gsk_••••••••••••••••"
                      className="flex-1 px-4 py-3 rounded-xl glass-dark border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      disabled
                    />
                    <button className="px-6 py-3 rounded-xl font-semibold text-white glass-dark border border-white/10 hover:border-purple-500 transition-all">
                      Update
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    🔒 Securely stored and encrypted
                  </p>
                </div>

                <div>
                  <label className="block text-white/70 font-medium mb-2">Backend URL</label>
                  <input
                    type="text"
                    value={process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}
                    className="w-full px-4 py-3 rounded-xl glass-dark border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass rounded-2xl border border-red-500/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-red-500/30 bg-red-500/10">
              <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
            </div>

            <div className="p-6 space-y-4">
              <button className="w-full px-6 py-3 rounded-xl border-2 border-red-500/50 text-red-400 font-semibold hover:bg-red-500/10 transition-all">
                Clear All Conversations
              </button>
              <button className="w-full px-6 py-3 rounded-xl border-2 border-red-500/50 text-red-400 font-semibold hover:bg-red-500/10 transition-all">
                Reset All Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
