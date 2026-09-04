import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: токен + идемпотентность
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('api_token');
  if (token) {
    config.headers['X-API-Token'] = token;
  }
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() ?? '')) {
    config.headers['Idempotency-Key'] = crypto.randomUUID();
  }
  return config;
});

// Response interceptor: обработка 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('api_token');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  },
);

// Вспомогательная функция извлечения данных
export function extractData<T>(response: { data: { success: boolean; data: T } }): T {
  if (!response.data.success) {
    throw new Error('API вернул success: false');
  }
  return response.data.data;
}

// Вспомогательная функция извлечения ошибки
export function extractError(error: any): { code: string; message: string; details?: any } {
  return (
    error.response?.data?.error || {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Произошла неизвестная ошибка',
    }
  );
}