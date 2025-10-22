import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { getDocuments, uploadDocument } from '../lib/api';
import { formatDate } from '../lib/utils';

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
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
      setUploadMessage(`✅ ${response.message}`);
      setTimeout(() => {
        loadDocuments();
      }, 2000);
    } catch (error: any) {
      setUploadMessage(`❌ Error: ${error.message || 'Upload failed'}`);
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

  if (loading) {
    return (
      <Layout title="Documents">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <div className="text-[var(--text-secondary)]">Loading documents...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Documents">
      <div className="p-6 space-y-6">
        {/* Upload Section */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Upload Document</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Upload PDFs, text files, or markdown documents to enhance AI knowledge</p>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)]'
                : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]'
            }`}
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

            <CloudArrowUpIcon className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-4" />
            
            <div className="text-[var(--text-primary)] font-medium mb-2">
              {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
            </div>
            
            <div className="text-sm text-[var(--text-secondary)] mb-4">
              Supported formats: PDF, TXT, MD, CSV
            </div>

            {!uploading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                <ArrowUpTrayIcon className="w-5 h-5 inline-block mr-2" />
                Select File
              </button>
            )}

            {uploading && (
              <div className="flex items-center justify-center gap-2">
                <div className="spinner"></div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>

          {uploadMessage && (
            <div className={`mt-4 p-3 rounded-lg ${
              uploadMessage.startsWith('✅')
                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {uploadMessage}
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Uploaded Documents</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Documents that power the AI assistant</p>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-4" />
              <div className="text-[var(--text-secondary)]">No documents uploaded yet</div>
              <div className="text-sm text-[var(--text-tertiary)] mt-1">Upload your first document to get started</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[var(--border-primary)]">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => (
                    <tr key={index} className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <DocumentTextIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                          <span className="text-sm">{doc.filename || doc.name || 'Untitled'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {doc.file_type || doc.type || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
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
        </div>
      </div>
    </Layout>
  );
}
