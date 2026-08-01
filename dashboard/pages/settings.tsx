import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getModels, ModelOption } from '../lib/api';
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  ServerIcon,
  CheckCircleIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    const storedModel = typeof window !== 'undefined' ? localStorage.getItem('selected_model') : null;

    getModels()
      .then((res) => {
        setModels(res.models || []);
        setDefaultModel(storedModel || res.default_model);
      })
      .catch((error) => console.error('Failed to load models:', error))
      .finally(() => setModelsLoading(false));
  }, []);

  const handleSelectModel = (modelId: string) => {
    setDefaultModel(modelId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_model', modelId);
    }
  };

  const handleSave = () => {
    // Simulate save
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Layout title="Settings">
      <div className="p-6 space-y-6 max-w-4xl">
        {/* General Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Cog6ToothIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold">General Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border-primary)]">
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-[var(--text-secondary)]">Receive system notifications</div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[var(--border-primary)]">
              <div>
                <div className="font-medium">Auto-save</div>
                <div className="text-sm text-[var(--text-secondary)]">Automatically save changes</div>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSave ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <KeyIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold">API Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Backend API URL</label>
              <input
                type="text"
                value="https://ai-support-backend-z4eq.onrender.com"
                readOnly
                className="input bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">RAG Service URL</label>
              <input
                type="text"
                value="https://ai-support-rag.onrender.com"
                readOnly
                className="input bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              />
            </div>
          </div>
        </div>

        {/* Model Picker */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <CpuChipIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold">Default Chat Model</h3>
          </div>

          {modelsLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <div className="spinner"></div>
              Loading free models...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectModel(m.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    m.id === defaultModel
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                      : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{m.label}</span>
                    {m.id === defaultModel && <CheckCircleIcon className="w-4 h-4 text-[var(--accent-primary)]" />}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    {m.context_length.toLocaleString()} ctx · free
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System Information */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <ServerIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold">System Information</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-[var(--border-primary)]">
              <span className="text-[var(--text-secondary)]">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-primary)]">
              <span className="text-[var(--text-secondary)]">Platform</span>
              <span className="font-medium">Render.com</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-primary)]">
              <span className="text-[var(--text-secondary)]">LLM Provider</span>
              <span className="font-medium">OpenRouter (free models)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-primary)]">
              <span className="text-[var(--text-secondary)]">Embeddings</span>
              <span className="font-medium">OpenRouter (nemotron-embed-vl-1b-v2, 2048-dim)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--text-secondary)]">Vector Database</span>
              <span className="font-medium">Qdrant Cloud</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold">Security</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-500">All services are secure and encrypted</span>
            </div>
            <button className="btn-secondary w-full">
              Change API Keys
            </button>
            <button className="btn-secondary w-full">
              View Activity Logs
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="btn-primary px-6"
          >
            Save Changes
          </button>
          {saved && (
            <div className="flex items-center gap-2 text-[var(--accent-success)] animate-fade-in">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm">Settings saved successfully</span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
