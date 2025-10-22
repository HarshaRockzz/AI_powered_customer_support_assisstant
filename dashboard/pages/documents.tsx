import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { 
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  FolderOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { getDocuments, uploadDocument } from '@/lib/api';
import { formatDate } from '@/lib/utils';

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
      setUploadMessage(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      event.target.value = '';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-yellow-400 animate-spin" />;
      default:
        return <ClockIcon className="w-5 h-5 text-white/40" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <Layout currentPage="documents">
      {/* Header */}
      <div className="glass border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              <FolderOpenIcon className="w-8 h-8 text-purple-400" />
              Document Management
            </h1>
            <p className="text-white/70 font-medium">
              Upload and manage documents for your AI assistant's knowledge base
            </p>
          </div>
          <div className="px-5 py-3 rounded-xl glass-dark border border-white/20">
            <p className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-400" />
              {documents.length} Documents
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Upload Section with Drag & Drop */}
          <div
            className={`glass rounded-2xl p-8 mb-8 border-2 border-dashed transition-all hover-lift ${
              dragActive 
                ? 'border-purple-400 bg-purple-500/10' 
                : 'border-white/20'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <CloudArrowUpIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Document</h2>
              <p className="text-white/60 mb-6">
                Drag and drop your files here, or click to browse
              </p>
              
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".pdf,.txt,.md,.csv"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="relative overflow-hidden px-8 py-4 rounded-xl font-semibold text-white hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                <span className="relative flex items-center gap-2">
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Choose File'}
                </span>
              </button>
              
              <p className="text-sm text-white/50 mt-4 flex items-center justify-center gap-2">
                <DocumentTextIcon className="w-4 h-4" />
                Supports: PDF, TXT, MD, CSV (Max 10MB)
              </p>
            </div>
            
            {uploadMessage && (
              <div className={`mt-6 p-4 rounded-xl glass-dark border ${
                uploadMessage.startsWith('✅') 
                  ? 'border-green-500/30' 
                  : 'border-red-500/30'
              }`}>
                <p className="text-white font-medium text-center">{uploadMessage}</p>
              </div>
            )}
          </div>

          {/* Documents Table */}
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-purple-400" />
                Uploaded Documents
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Chunks
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Uploaded
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
                          <p className="text-white/70 font-medium">Loading documents...</p>
                        </div>
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <FolderOpenIcon className="w-16 h-16 text-white/20 mb-4" />
                          <p className="text-white/60 font-medium">No documents uploaded yet</p>
                          <p className="text-white/40 text-sm mt-2">Upload your first document to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                              <DocumentTextIcon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {doc.file_name}
                              </div>
                              <div className="text-xs text-white/50 font-mono">{doc.file_type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(doc.status)}
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(
                                doc.status
                              )}`}
                            >
                              {doc.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-white">
                            {doc.chunk_count || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-white/70">
                            {doc.file_size
                              ? `${(doc.file_size / 1024).toFixed(2)} KB`
                              : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-white/60 font-medium">
                            {formatDate(doc.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
