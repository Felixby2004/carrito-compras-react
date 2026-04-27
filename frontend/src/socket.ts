import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });
    
    socket.on('connect', () => {
      console.log('Socket conectado:', socket?.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    socket.on('nueva-orden', (data) => {
      console.log('Nueva orden recibida:', data);
    });

    socket.on('cambio-estado-orden', (data) => {
      console.log('Cambio de estado de orden:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('Error de conexión socket:', error);
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