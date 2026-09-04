import axios from 'axios';

// API base URL from environment or default to FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access_token);
          if (new_refresh_token) {
            localStorage.setItem('refresh_token', new_refresh_token);
          }
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/doctor/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods aligned with MediKiosk REST contract
export const auth = {
  staffLogin: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  staffLogout: (refreshToken?: string) =>
    apiClient.post('/auth/logout', { refresh_token: refreshToken || '' }),
  getMe: () => apiClient.get('/auth/me'),
};

export const sessions = {
  create: (data: { kiosk_code?: string; kiosk_id?: string; patient: { full_name: string; date_of_birth?: string; sex?: string; phone?: string }; language?: string; branch?: string }) =>
    apiClient.post('/sessions', data),
  get: (sessionId: string) =>
    apiClient.get(`/sessions/${sessionId}`),
};

export const intake = {
  submitAnswer: (data: { session_id: string; node_id: string; transcript: string; language?: string }) =>
    apiClient.post('/intake/answer', data),
};

export const documents = {
  uploadPrescription: (sessionId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    return apiClient.post(`/documents/prescription`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: (documentId: string) =>
    apiClient.get(`/documents/${documentId}`),
};

export const doctor = {
  getQueue: () => apiClient.get('/doctor/queue'),
  getPatient: (tokenNumberOrSessionId: string) =>
    apiClient.get(`/doctor/queue/${tokenNumberOrSessionId}`),
  recordDiagnosis: (sessionId: string, data: { diagnosis_text: string; notes?: string }) =>
    apiClient.post(`/doctor/encounters/${sessionId}/diagnosis`, data),
};

export const speech = {
  transcribe: (audio: Blob, language: string) => {
    const formData = new FormData();
    formData.append('audio', audio);
    formData.append('language', language);
    return apiClient.post('/speech/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  synthesize: (text: string, language: string) =>
    apiClient.post('/speech/synthesize', { text, language }, { responseType: 'blob' }),
};

export const support = {
  // request: (data: { kiosk_id: string; session_id?: string; type: string }) =>
  //   apiClient.post('/support/request', data).catch(() => ({ data: { status: 'mock_sent' } })),
};

export const fhir = {
  generate: (sessionId: string) =>
    apiClient.post(`/fhir/generate/${sessionId}`),
  get: (sessionId: string) =>
    apiClient.get(`/fhir/${sessionId}`),
};

export const admin = {
  questions: {
    list: () => apiClient.get('/admin/questions'),
    get: (nodeId: string) => apiClient.get(`/admin/questions/${nodeId}`),
    create: (data: any) => apiClient.post('/admin/questions', data),
    update: (nodeId: string, data: any) => apiClient.put(`/admin/questions/${nodeId}`, data),
    delete: (nodeId: string) => apiClient.delete(`/admin/questions/${nodeId}`),
  },
  staff: {
    list: () => apiClient.get('/admin/staff'),
    create: (data: any) => apiClient.post('/admin/staff', data),
    update: (id: string, data: any) => apiClient.put(`/admin/staff/${id}`, data),
    delete: (id: string) => apiClient.delete(`/admin/staff/${id}`),
  },
  kiosks: {
    list: () => apiClient.get('/admin/kiosks'),
    create: (data: any) => apiClient.post('/admin/kiosks', data),
    update: (id: string, data: any) => apiClient.put(`/admin/kiosks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/admin/kiosks/${id}`),
  },
  sessions: {
    list: () => apiClient.get('/admin/sessions').catch(() => ({ data: { sessions: [] } })),
  },
  audit: {
    list: () => apiClient.get('/admin/audit-logs'),
  },
};
