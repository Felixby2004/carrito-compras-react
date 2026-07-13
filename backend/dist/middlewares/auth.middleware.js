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
    console.log('🔐 [optionalAuthenticate] Starting for URL:', req.url);
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('🔐 [optionalAuthenticate] No Bearer token found, continue as guest');
            return next();
        }
        const token = authHeader.replace('Bearer ', '');
        console.log('🔐 [optionalAuthenticate] Token found, length:', token.length);
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
            console.log('🔐 [optionalAuthenticate] Token decoded:', decoded);
        }
        catch (e) {
            console.error('🔐 [optionalAuthenticate] Token verification failed, continue as guest. Error:', e);
            return next();
        }
        const usuario = await prisma.seg_usuarios.findUnique({
            where: { id: decoded.id, activo: true },
            include: { usuario_roles: { include: { rol: true } } },
        });
        if (usuario) {
            console.log('🔐 [optionalAuthenticate] Usuario encontrado, setting req.user:', usuario.id, usuario.email);
            req.user = {
                id: usuario.id,
                email: usuario.email,
                roles: usuario.usuario_roles.map((ur) => ur.rol.nombre)
            };
        }
        else {
            console.log('🔐 [optionalAuthenticate] No usuario found with id:', decoded.id);
        }
    }
    catch (error) {
        console.error('🔐 [optionalAuthenticate] Unhandled error (ignored):', error);
    }
    console.log('🔐 [optionalAuthenticate] Calling next(), req.user exists:', !!req.user);
    next(); // Always continue no matter what!
};
exports.optionalAuthenticate = optionalAuthenticate;
