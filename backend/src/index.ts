import app from './app';
import config from './config';
import logger from './utils/logger';
import path from 'path';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = config.port;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    credentials: true,
  },
});

// Almacenar productos y sus precios actuales (opcional)
const preciosProductos = new Map();

// Middleware para autenticación de sockets (opcional)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Aquí podrías verificar el token si es necesario
  next();
});

io.on('connection', (socket) => {
  // Unirse a sala de productos específicos
  socket.on('suscribir-producto', (productoId) => {
    socket.join(`producto_${productoId}`);
  });

  socket.on('unsuscribir-producto', (productoId) => {
    socket.leave(`producto_${productoId}`);
  });

  socket.on('disconnect', () => {
  });
});

// Servir archivos estáticos ANTES de las rutas
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Exportar io para usar en otros archivos
export { io };

// SOLO UNA LLAMADA A server.listen
server.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  logger.info(`📚 Documentación API disponible en http://localhost:${PORT}/api/docs`);
  logger.info(`🔌 WebSocket corriendo en ws://localhost:${PORT}`);
  logger.info(`🌍 Entorno: ${config.nodeEnv}`);
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});