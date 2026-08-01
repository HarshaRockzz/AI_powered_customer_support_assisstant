import axios from 'axios';

// Backend API URL - Use environment variable or fallback to localhost
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// Debug: Log the backend URL being used
if (typeof window !== 'undefined') {
  console.log('🔍 Backend URL:', BACKEND_URL);
}

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
  model?: string;
  stream?: boolean;
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

export interface ModelOption {
  id: string;
  label: string;
  context_length: number;
}

export interface ModelsResponse {
  provider: string;
  default_model: string;
  models: ModelOption[];
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

export const getModels = async (retries: number = 2): Promise<ModelsResponse> => {
  try {
    const response = await api.get('/api/models');
    return response.data;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return getModels(retries - 1);
    }
    throw error;
  }
};

/**
 * Streams a query response token-by-token via SSE using fetch + ReadableStream
 * (axios doesn't handle SSE well). Calls onToken for each text chunk, and
 * onDone once with the final metadata (context/model/tokens_used).
 */
export const streamQuery = async (
  request: QueryRequest,
  onToken: (token: string) => void,
  onDone: (meta: { context: string[]; model: string; tokens_used: number }) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const rawEvent of events) {
        if (!rawEvent.trim()) continue;

        const lines = rawEvent.split('\n');
        let eventType = 'message';
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          if (line.startsWith('data: ')) data = line.slice(6);
        }
        if (!data) continue;

        const parsed = JSON.parse(data);
        if (eventType === 'done') {
          onDone(parsed);
        } else if (eventType === 'error') {
          throw new Error(parsed.error || 'Unknown streaming error');
        } else if (parsed.token) {
          onToken(parsed.token);
        }
      }
    }
  } catch (error) {
    if (onError) onError(error as Error);
    else throw error;
  }
};

export default api;

