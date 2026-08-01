import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { getDocuments, uploadDocument } from '../lib/api';
import { formatDate } from '../lib/utils';

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadOk, setUploadOk] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments(50, 0);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setUploadMessage('');

    try {
      const response = await uploadDocument(file);
      setUploadOk(true);
      setUploadMessage(response.message);
      setTimeout(() => {
        loadDocuments();
      }, 2000);
    } catch (error: any) {
      setUploadOk(false);
      setUploadMessage(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <Layout title="Documents">
      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* Upload Section */}
        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold">Upload Document</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Upload PDFs, text files, or markdown documents to enhance AI knowledge
            </p>
          </div>

          <motion.div
            animate={{
              borderColor: dragActive ? 'var(--accent-primary)' : 'var(--border-primary)',
              scale: dragActive ? 1.01 : 1,
            }}
            className="relative border-2 border-dashed rounded-[var(--radius-lg)] p-10 text-center transition-colors"
            style={{ background: dragActive ? 'rgba(91, 140, 255, 0.05)' : 'transparent' }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />

            <motion.div
              animate={{ y: dragActive ? -4 : 0 }}
              className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4"
              style={{ background: 'rgba(91, 140, 255, 0.1)', color: 'var(--accent-primary)' }}
            >
              <CloudArrowUpIcon className="w-7 h-7" />
            </motion.div>

            <div className="text-[var(--text-primary)] font-medium mb-1.5">
              {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
            </div>

            <div className="text-sm text-[var(--text-tertiary)] mb-5">
              Supported formats: PDF, TXT, MD, CSV
            </div>

            {!uploading ? (
              <Button
                variant="primary"
                icon={<ArrowUpTrayIcon className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                <div className="spinner" />
                <span>Processing...</span>
              </div>
            )}
          </motion.div>

          <AnimatePresence>
            {uploadMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-4 p-3 rounded-[var(--radius-sm)] text-sm ${
                  uploadOk
                    ? 'bg-[rgba(61,220,132,0.1)] text-[var(--accent-success)] border border-[rgba(61,220,132,0.2)]'
                    : 'bg-[rgba(255,107,107,0.1)] text-[var(--accent-danger)] border border-[rgba(255,107,107,0.2)]'
                }`}
              >
                {uploadOk ? <CheckCircleIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" /> : <XCircleIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
                {uploadMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Documents List */}
        <Card padding="none">
          <div className="p-5 pb-4">
            <h3 className="text-base font-semibold">Uploaded Documents</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Documents that power the AI assistant</p>
          </div>

          {loading ? (
            <div className="divide-y divide-[var(--border-primary)]">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<DocumentTextIcon className="w-6 h-6" />}
              title="No documents uploaded yet"
              description="Upload your first document to get started."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-t border-b border-[var(--border-primary)]">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Name</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Type</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => (
                    <tr key={index} className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-[var(--radius-sm)]" style={{ background: 'var(--bg-tertiary)' }}>
                            <DocumentTextIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                          </div>
                          <span className="text-sm font-medium">{doc.filename || doc.name || 'Untitled'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-sm text-[var(--text-secondary)] uppercase">
                          {doc.file_type || doc.type || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`badge ${
                          doc.status === 'processed' ? 'badge-success' :
                          doc.status === 'failed' ? 'badge-danger' :
                          'badge-warning'
                        }`}>
                          {doc.status === 'processed' && <CheckCircleIcon className="w-3 h-3" />}
                          {doc.status === 'failed' && <XCircleIcon className="w-3 h-3" />}
                          {doc.status === 'processing' && <ClockIcon className="w-3 h-3" />}
                          {doc.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {doc.created_at ? formatDate(doc.created_at) : 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
