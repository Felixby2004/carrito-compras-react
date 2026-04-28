"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearAuditAction = exports.auditMiddleware = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = __importDefault(require("../config"));
const errorHandler_1 = require("./errorHandler");
const prisma = new client_1.PrismaClient();
// Middleware de autenticación (el que necesitas)
const authenticate = async (req, _res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new errorHandler_1.AppError('Token no proporcionado', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        const usuario = await prisma.seg_usuarios.findUnique({
            where: { id: decoded.id, activo: true },
            include: {
                usuario_roles: {
                    include: {
                        rol: true,
                    },
                },
            },
        });
        if (!usuario) {
            throw new errorHandler_1.AppError('Usuario no encontrado o inactivo', 401);
        }
        req.user = {
            id: usuario.id,
            email: usuario.email,
            roles: usuario.usuario_roles.map((ur) => ur.rol.nombre),
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errorHandler_1.AppError('Token inválido o expirado', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
// Middleware de auditoría (opcional, puedes mantenerlo)
const auditMiddleware = async (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.auditAction) {
            const { accion, modulo, tabla, registro_id, datos_anteriores, datos_nuevos } = res.locals.auditAction;
            const ip = req.ip || req.connection.remoteAddress || 'desconocida';
            const usuario_id = req.user?.id;
            // (Opcional) registrar auditoría
            console.log('Auditoría:', { usuario_id, accion, modulo, tabla, registro_id, ip });
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.auditMiddleware = auditMiddleware;
const crearAuditAction = (accion, modulo, tabla, registro_id, datos_anteriores, datos_nuevos) => {
    return { accion, modulo, tabla, registro_id, datos_anteriores, datos_nuevos };
};
exports.crearAuditAction = crearAuditAction;
