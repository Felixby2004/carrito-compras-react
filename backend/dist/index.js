"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const PORT = config_1.default.port;
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: config_1.default.frontendUrl,
        credentials: true,
    },
});
exports.io = io;
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
        }
        catch (error) {
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
app_1.default.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
console.log('🔗 FRONTEND_URL configurada:', config_1.default.frontendUrl);
console.log('🔐 CORS permitiendo origen:', config_1.default.frontendUrl);
// SOLO UNA LLAMADA A server.listen
server.listen(PORT, () => {
    logger_1.default.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    logger_1.default.info(`📚 Documentación API disponible en http://localhost:${PORT}/api/docs`);
    logger_1.default.info(`🔌 WebSocket corriendo en ws://localhost:${PORT}`);
    logger_1.default.info(`🌍 Entorno: ${config_1.default.nodeEnv}`);
    logger_1.default.info(`🔗 Frontend permitido: ${config_1.default.frontendUrl}`);
});
process.on('unhandledRejection', (reason, _promise) => {
    logger_1.default.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
