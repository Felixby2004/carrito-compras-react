import app from './app';
import config from './config';
import logger from './utils/logger';
import path from 'path';
import express from 'express';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  logger.info(`📚 Documentación API disponible en http://localhost:${PORT}/api/docs`);
  logger.info(`🌍 Entorno: ${config.nodeEnv}`);
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));