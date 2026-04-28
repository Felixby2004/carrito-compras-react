// frontend/src/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Obtener la URL del WebSocket desde variable de entorno
const getWebSocketUrl = (): string => {
  // Si tenemos VITE_WS_URL, usarla
  if (import.meta.env.VITE_WS_URL) {
    console.log('📡 Usando VITE_WS_URL:', import.meta.env.VITE_WS_URL);
    return import.meta.env.VITE_WS_URL;
  }
  
  // Si no, derivar de VITE_API_URL
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    // Convertir https://... a wss://... y eliminar /api/v1
    const wsUrl = apiUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      .replace('/api/v1', '');
    console.log('📡 Derivando WebSocket URL de API:', wsUrl);
    return wsUrl;
  }
  
  // Fallback para desarrollo local
  console.log('📡 Usando fallback localhost:3000');
  return 'http://localhost:3000';
};

export const connectSocket = () => {
  if (!socket) {
    const wsUrl = getWebSocketUrl();
    console.log('🔌 Conectando WebSocket a:', wsUrl);
    
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      autoConnect: true,
      withCredentials: true,
      timeout: 10000, // 10 segundos de timeout
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket?.id);
      reconnectAttempts = 0; // Resetear intentos al conectar
    });
    
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      
      // Si la desconexión no es intencional, intentar reconectar
      if (reason !== 'io client disconnect' && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Intentando reconectar (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(() => {
          socket?.connect();
        }, 2000);
      }
    });

    socket.on('nueva-orden', (data) => {
      console.log('📦 Nueva orden recibida:', data);
      // Puedes emitir un evento personalizado para React
      window.dispatchEvent(new CustomEvent('nueva-orden', { detail: data }));
    });

    socket.on('cambio-estado-orden', (data) => {
      console.log('🔄 Cambio de estado de orden:', data);
      window.dispatchEvent(new CustomEvent('cambio-estado-orden', { detail: data }));
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión socket:', error.message);
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Reintentando conexión (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      } else {
        console.error('❌ Máximos intentos de reconexión alcanzados');
      }
    });

    // Manejar errores de reconexión
    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Intento de reconexión #${attempt}`);
    });

    socket.io.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión después de múltiples intentos');
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Desconectando WebSocket manualmente');
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

// Función para verificar el estado del socket
export const isSocketConnected = (): boolean => {
  return socket !== null && socket.connected;
};