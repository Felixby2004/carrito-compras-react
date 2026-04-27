import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    socket.on('connect', () => {});
    
    socket.on('disconnect', () => {});
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