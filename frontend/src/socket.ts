// frontend/src/socket.ts
import { io, Socket } from 'socket.io-client';
import { useProductoStore } from './stores/productoStore';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Obtener la URL del WebSocket desde variable de entorno
const getWebSocketUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    console.log('📡 Usando VITE_WS_URL:', import.meta.env.VITE_WS_URL);
    return import.meta.env.VITE_WS_URL;
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api/v1';
  const normalizedApiUrl = apiUrl.replace(/\/+$/, '');
  const wsUrl = normalizedApiUrl
    .replace(/^https:\/\//i, 'wss://')
    .replace(/^http:\/\//i, 'ws://')
    .replace(/\/api\/v1$/, '');

  console.log('📡 Derivando WebSocket URL de API:', wsUrl);
  return wsUrl;
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

    socket.on('precio-actualizado', (data) => {
      console.log('💲 Precio actualizado:', data);
      const { actualizarPrecio } = useProductoStore.getState();
      actualizarPrecio(data.productoId, data.precioNuevo);
    });

    socket.on('stock-actualizado', (data) => {
      console.log('📦 Stock actualizado:', data);
      const { actualizarStock } = useProductoStore.getState();
      actualizarStock(data.productoId, data.stockFisico, data.stockReservado, data.stockDisponible);
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