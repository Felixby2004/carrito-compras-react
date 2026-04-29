"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = __importDefault(require("../config"));
const errorHandler_1 = require("./errorHandler");
const prisma = new client_1.PrismaClient();
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
const optionalAuthenticate = async (req, _res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return next();
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
        if (usuario) {
            req.user = {
                id: usuario.id,
                email: usuario.email,
                roles: usuario.usuario_roles.map((ur) => ur.rol.nombre),
            };
        }
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new errorHandler_1.AppError('Sesión expirada', 401));
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new errorHandler_1.AppError('Token inválido', 401));
        }
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
