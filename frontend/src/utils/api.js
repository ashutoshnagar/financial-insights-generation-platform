import axios from 'axios';

// Use relative URLs in production (empty string), absolute in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE_PATH = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_PATH,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Upload files
export const uploadFiles = async (formData) => {
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Validate files before upload
export const validateFiles = async (formData) => {
  const response = await api.post('/upload/validate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get sample data format
export const getSampleFormat = async () => {
  const response = await api.get('/upload/sample');
  return response.data;
};

// Prepare data for analysis
export const prepareAnalysis = async (data) => {
  const response = await api.post('/analysis/prepare', data);
  return response.data;
};

// Run Variant 1 Analysis (User-Priority)
export const runVariant1Analysis = async (data) => {
  const response = await api.post('/analysis/variant1', data);
  return response.data;
};

// Run Variant 2 Analysis (Auto-Max Split)
export const runVariant2Analysis = async (data) => {
  const response = await api.post('/analysis/variant2', data);
  return response.data;
};

// Compare analysis results
export const compareAnalyses = async (data) => {
  const response = await api.post('/analysis/compare', data);
  return response.data;
};

// Get analysis session details
export const getSessionDetails = async (sessionId) => {
  const response = await api.get(`/analysis/session/${sessionId}`);
  return response.data;
};

// Clean up analysis session
export const cleanupSession = async (sessionId) => {
  const response = await api.delete(`/analysis/session/${sessionId}`);
  return response.data;
};

// Export analysis data
export const exportAnalysis = async (data) => {
  const response = await api.post('/export/tree', data);
  return response.data;
};

// Generate comprehensive report
export const generateReport = async (data) => {
  const response = await api.post('/export/report', data);
  return response.data;
};

// Download exported file
export const downloadFile = async (exportId) => {
  const response = await api.get(`/export/download/${exportId}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Clean up expired exports
export const cleanupExports = async () => {
  const response = await api.delete('/export/cleanup');
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
