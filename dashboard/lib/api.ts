import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface QueryRequest {
  query: string;
  session_id: string;
  user_id?: string;
}

export interface QueryResponse {
  query_id: number;
  session_id: string;
  query: string;
  response: string;
  context?: string[];
  model: string;
  latency_ms: number;
  cache_hit: boolean;
  timestamp: string;
}

export interface FeedbackRequest {
  query_id: number;
  session_id: string;
  score: number;
  comment?: string;
}

export interface Analytics {
  total_queries: number;
  total_feedback: number;
  positive_feedback: number;
  negative_feedback: number;
  average_latency_ms: number;
  cache_hit_rate: number;
  total_tokens_used: number;
  total_documents: number;
  active_sessions: number;
}

// API Functions
export const submitQuery = async (request: QueryRequest): Promise<QueryResponse> => {
  const response = await api.post('/api/query', request);
  return response.data;
};

export const submitFeedback = async (request: FeedbackRequest): Promise<void> => {
  await api.post('/api/feedback', request);
};

export const getAnalytics = async (): Promise<Analytics> => {
  const response = await api.get('/api/analytics');
  return response.data;
};

export const getTopQueries = async (limit: number = 10): Promise<any[]> => {
  const response = await api.get(`/api/analytics/top-queries?limit=${limit}`);
  return response.data.queries || [];
};

export const getQueryTrends = async (days: number = 7): Promise<any[]> => {
  const response = await api.get(`/api/analytics/trends?days=${days}`);
  return response.data.trends || [];
};

export const getFeedback = async (limit: number = 50): Promise<any[]> => {
  const response = await api.get(`/api/feedback?limit=${limit}`);
  return response.data.feedbacks || [];
};

export const uploadDocument = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/docs/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getDocuments = async (limit: number = 50, offset: number = 0): Promise<any[]> => {
  const response = await api.get(`/api/docs?limit=${limit}&offset=${offset}`);
  return response.data.documents || [];
};

export const getHealth = async (): Promise<any> => {
  const response = await api.get('/api/health');
  return response.data;
};

export default api;

