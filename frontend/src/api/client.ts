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

// Interceptor de respuesta para manejar refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si el error es 401 y no hemos intentado reintentar la petición
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Si el refresh falla, redirigir a login o limpiar tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
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