"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearAuditAction = exports.auditMiddleware = void 0;
const auditoria_service_1 = __importDefault(require("../services/auditoria.service"));
/**
 * Middleware que envuelve una acción para registrar auditoría
 * Usa un parámetro especial en locals para indicar qué registrar
 */
const auditMiddleware = async (req, res, next) => {
    // Almacenar información original para comparar después
    const originalSend = res.send;
    res.send = function (data) {
        // Si la respuesta es exitosa y contiene datos, registrar auditoría
        if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.auditAction) {
            const { accion, modulo, tabla, registro_id, datos_anteriores, datos_nuevos } = res.locals.auditAction;
            const ip = req.ip || req.connection.remoteAddress || 'desconocida';
            const usuario_id = req.user?.id;
            // No esperar a que se complete la auditoría
            auditoria_service_1.default.registrarAccion({
                usuario_id,
                accion,
                modulo,
                tabla,
                registro_id,
                datos_anteriores,
                datos_nuevos,
                ip,
            }).catch(err => console.error('Error en auditoría:', err));
        }
        // Llamar al método original
        return originalSend.call(this, data);
    };
    next();
};
exports.auditMiddleware = auditMiddleware;
/**
 * Helper para registrar auditoría desde controladores
 * Uso en controladores: res.locals.auditAction = crearAuditAction(...)
 */
const crearAuditAction = (accion, modulo, tabla, registro_id, datos_anteriores, datos_nuevos) => {
    return {
        accion,
        modulo,
        tabla,
        registro_id,
        datos_anteriores,
        datos_nuevos,
    };
};
exports.crearAuditAction = crearAuditAction;
