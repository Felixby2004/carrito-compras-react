import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api/v1';
console.log('📡 API Client baseURL:', baseURL);

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // opcional (solo si usas cookies)
});

// Función para obtener o crear un sessionId PERSISTENTE
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('cartSessionId');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('cartSessionId', sessionId);
  }
  return sessionId;
};

// Interceptor para agregar sessionId a TODAS las peticiones (excepto auth)
apiClient.interceptors.request.use((config) => {
  console.log('📤 API Client: Requesting', config.method?.toUpperCase(), config.url);
  const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
  
  if (!isAuthRequest) {
    const sessionId = getOrCreateSessionId();
    config.headers['X-Session-Id'] = sessionId;
  }
  
  // Agregar token de autenticación si existe
  const token = localStorage.getItem('accessToken');
  if (token) {
    console.log('📤 API Client: Adding Authorization header');
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('📤 API Client: No Authorization header');
  }
  
  return config;
});

// Interceptor de respuesta para manejar refresh token
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 API Client: Response received with status', response.status, 'for', response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Client: Error response', error.response?.status, error.config?.url);
    const originalRequest = error.config;
    
    // Evitar loop si el endpoint que falló con 401 es /auth/refresh-token
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh-token');

    if (isRefreshRequest) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      const { clearAuth } = useAuthStore.getState();
      clearAuth();
      return Promise.reject(error);
    }

    // Si el error es 401 y no hemos intentado reintentar la petición
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 API Client: 401 received, trying refresh token...');
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      console.log('🔄 API Client: Refresh token present:', !!refreshToken);
      if (refreshToken) {
        try {
          console.log('🔄 API Client: Calling refresh token endpoint...');
          const response = await apiClient.post('/auth/refresh-token', {
            refreshToken
          });
          console.log('🔄 API Client: Refresh token response received!');
          
          const { user, accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update auth store with new user and tokens
          const { setAuthData } = useAuthStore.getState();
          setAuthData(user, accessToken, newRefreshToken);
          
          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          console.log('🔄 API Client: Retrying original request...');
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('❌ API Client: Refresh token failed:', refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          const { clearAuth } = useAuthStore.getState();
          clearAuth();
          return Promise.reject(refreshError);
        }
      } else {
        console.log('❌ API Client: No refresh token available!');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
      }
    }
    
    return Promise.reject(error);
  }
);

export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export default apiClient;