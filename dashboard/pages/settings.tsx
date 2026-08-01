import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { getModels, ModelOption } from '../lib/api';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  KeyIcon,
  ServerIcon,
  CheckCircleIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
      style={{ background: checked ? 'var(--gradient-brand)' : 'var(--bg-tertiary)' }}
    >
      <motion.span
        className="inline-block h-4 w-4 rounded-full bg-white shadow"
        animate={{ x: checked ? 22 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

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
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Layout title="Settings">
      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.06 }}
        className="p-6 space-y-5 max-w-4xl"
      >
        {/* General Settings */}
        <motion.div variants={sectionVariants}>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-[var(--radius-sm)]" style={{ background: 'rgba(91,140,255,0.1)' }}>
                <Cog6ToothIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-base font-semibold">General Settings</h3>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between py-3 border-b border-[var(--border-primary)]">
                <div>
                  <div className="font-medium text-sm">Notifications</div>
                  <div className="text-sm text-[var(--text-secondary)]">Receive system notifications</div>
                </div>
                <Toggle checked={notifications} onChange={() => setNotifications(!notifications)} />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-sm">Auto-save</div>
                  <div className="text-sm text-[var(--text-secondary)]">Automatically save changes</div>
                </div>
                <Toggle checked={autoSave} onChange={() => setAutoSave(!autoSave)} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* API Configuration */}
        <motion.div variants={sectionVariants}>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-[var(--radius-sm)]" style={{ background: 'rgba(91,140,255,0.1)' }}>
                <KeyIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-base font-semibold">API Configuration</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Backend API URL</label>
                <input
                  type="text"
                  value="https://ai-support-backend-z4eq.onrender.com"
                  readOnly
                  className="input bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">RAG Service URL</label>
                <input
                  type="text"
                  value="https://ai-support-rag.onrender.com"
                  readOnly
                  className="input bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-default"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Model Picker */}
        <motion.div variants={sectionVariants}>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-[var(--radius-sm)]" style={{ background: 'rgba(91,140,255,0.1)' }}>
                <CpuChipIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-base font-semibold">Default Chat Model</h3>
            </div>

            {modelsLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <div className="spinner" />
                Loading free models...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {models.map((m) => {
                  const isSelected = m.id === defaultModel;
                  return (
                    <motion.button
                      key={m.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectModel(m.id)}
                      className="relative text-left p-3.5 rounded-[var(--radius-md)] border transition-colors duration-150"
                      style={{
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)',
                        background: isSelected ? 'rgba(91,140,255,0.08)' : 'var(--bg-tertiary)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{m.label}</span>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <CheckCircleIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-1">
                        {m.context_length.toLocaleString()} ctx · free
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* System Information */}
        <motion.div variants={sectionVariants}>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-[var(--radius-sm)]" style={{ background: 'rgba(91,140,255,0.1)' }}>
                <ServerIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-base font-semibold">System Information</h3>
            </div>

            <div className="space-y-0.5">
              {[
                ['Version', '1.0.0'],
                ['Platform', 'Render.com'],
                ['LLM Provider', 'OpenRouter (free models)'],
                ['Embeddings', 'OpenRouter (nemotron-embed-vl-1b-v2, 2048-dim)'],
                ['Vector Database', 'Qdrant Cloud'],
              ].map(([label, value], i, arr) => (
                <div
                  key={label}
                  className={`flex justify-between py-2.5 text-sm ${i < arr.length - 1 ? 'border-b border-[var(--border-primary)]' : ''}`}
                >
                  <span className="text-[var(--text-secondary)]">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div variants={sectionVariants}>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-[var(--radius-sm)]" style={{ background: 'rgba(91,140,255,0.1)' }}>
                <ShieldCheckIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-base font-semibold">Security</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)]" style={{ background: 'rgba(61,220,132,0.1)', border: '1px solid rgba(61,220,132,0.2)' }}>
                <CheckCircleIcon className="w-5 h-5 text-[var(--accent-success)]" />
                <span className="text-sm text-[var(--accent-success)]">All services are secure and encrypted</span>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1">Change API Keys</Button>
                <Button variant="secondary" className="flex-1">View Activity Logs</Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={sectionVariants} className="flex items-center gap-3">
          <Button variant="primary" size="lg" onClick={handleSave}>
            Save Changes
          </Button>
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[var(--accent-success)]"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span className="text-sm">Settings saved successfully</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
