import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Obtener la URL del WebSocket desde variable de entorno
const getWebSocketUrl = () => {
  // Si tenemos VITE_WS_URL, usarla
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // Si no, derivar de VITE_API_URL
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    // Convertir https://... a wss://... y eliminar /api/v1
    return apiUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      .replace('/api/v1', '');
  }
  
  // Fallback para desarrollo local
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
      reconnectionAttempts: 5,
      autoConnect: true,
      withCredentials: true, // Importante para CORS
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket?.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
    });

    socket.on('nueva-orden', (data) => {
      console.log('📦 Nueva orden recibida:', data);
    });

    socket.on('cambio-estado-orden', (data) => {
      console.log('🔄 Cambio de estado de orden:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión socket:', error.message);
    });
  }
  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};