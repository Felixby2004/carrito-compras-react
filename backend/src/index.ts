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
  console.log('🟢 Cliente conectado:', socket.id);

  // Unirse a sala de productos específicos
  socket.on('suscribir-producto', (productoId) => {
    socket.join(`producto_${productoId}`);
  });

  socket.on('unsuscribir-producto', (productoId) => {
    socket.leave(`producto_${productoId}`);
  });

  // Cliente solicita procesar pago
  socket.on('procesar-pago', async (data) => {
    try {
      console.log('💰 Procesando pago:', data);
      
      const { ordenId, metodoPago, monto, tokenPago } = data;
      socket.emit('pago-procesado', {
        success: true,
        ordenId: ordenId,
        mensaje: 'Pago completado exitosamente'
      });
      
      // También emitir a todos los admins
      io.emit('nueva-orden-pagada', { ordenId });
      
    } catch (error) {
      console.error('Error en pago:', error);
      socket.emit('error-pago', {
        success: false,
        error: error.message
      });
    }
  });
  
  // Cliente consulta estado de pago
  socket.on('consultar-pago', async (data) => {
    const { ordenId } = data;
    // Consultar estado del pago
    socket.emit('estado-pago', {
      ordenId,
      estado: 'pendiente'
    });
  });

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado:', socket.id);
  });
});

// Servir archivos estáticos ANTES de las rutas
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Exportar io para usar en otros archivos
export { io };

console.log('🔗 FRONTEND_URL configurada:', config.frontendUrl);
console.log('🔐 CORS permitiendo origen:', config.frontendUrl);

// SOLO UNA LLAMADA A server.listen
server.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  logger.info(`📚 Documentación API disponible en http://localhost:${PORT}/api/docs`);
  logger.info(`🔌 WebSocket corriendo en ws://localhost:${PORT}`);
  logger.info(`🌍 Entorno: ${config.nodeEnv}`);
  logger.info(`🔗 Frontend permitido: ${config.frontendUrl}`);
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});