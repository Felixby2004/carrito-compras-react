import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // en prod será tu Render
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
  const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
  
  if (!isAuthRequest) {
    const sessionId = getOrCreateSessionId();
    config.headers['X-Session-Id'] = sessionId;
  }
  
  // Agregar token de autenticación si existe
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export default apiClient;