"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config"));
const errorHandler_1 = require("../middlewares/errorHandler");
const email_1 = require("../utils/email");
const prisma = new client_1.PrismaClient();
class AuthService {
    async hashPassword(password) {
        return bcrypt_1.default.hash(password, 12);
    }
    async comparePassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    generateAccessToken(userId, email) {
        const payload = { id: userId, email };
        const secret = config_1.default.jwtSecret;
        const options = { expiresIn: config_1.default.jwtExpiresIn };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    generateRefreshToken() {
        return crypto_1.default.randomBytes(40).toString('hex');
    }
    async register(data) {
        // Verificar si el email ya existe
        const existingUser = await prisma.seg_usuarios.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new errorHandler_1.AppError('El email ya está registrado', 409);
        }
        // Hash password
        const hashedPassword = await this.hashPassword(data.password);
        // Crear verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Crear usuario en transacción
        const result = await prisma.$transaction(async (tx) => {
            const usuario = await tx.seg_usuarios.create({
                data: {
                    email: data.email,
                    password_hash: hashedPassword,
                    token_verificacion: verificationToken,
                    email_verificado: true,
                    activo: true,
                },
            });
            await tx.configuracion_sistema.upsert({
                where: { clave: `perfil_usuario_${usuario.id}` },
                update: {
                    valor: JSON.stringify({ nombre: data.nombre, apellido: data.apellido }),
                    descripcion: 'Perfil basico de usuario',
                },
                create: {
                    clave: `perfil_usuario_${usuario.id}`,
                    valor: JSON.stringify({ nombre: data.nombre, apellido: data.apellido }),
                    descripcion: 'Perfil basico de usuario',
                },
            });
            // Crear perfil de cliente
            const cliente = await tx.cli_clientes.create({
                data: {
                    usuario_id: usuario.id,
                    telefono: data.telefono,
                    total_gastado: 0,
                    segmento: 'nuevo',
                },
            });
            // Asignar rol de cliente
            const rolCliente = await tx.seg_roles.findFirst({
                where: { nombre: 'cliente' },
            });
            if (rolCliente) {
                await tx.seg_usuario_rol.create({
                    data: {
                        usuario_id: usuario.id,
                        rol_id: rolCliente.id,
                    },
                });
            }
            return { usuario, cliente };
        });
        // Enviar email de verificación (no bloqueante)
        try {
            await (0, email_1.sendVerificationEmail)(data.email, verificationToken);
        }
        catch {
            // ignore
        }
        // Generar tokens
        const accessToken = this.generateAccessToken(result.usuario.id, result.usuario.email);
        const refreshToken = this.generateRefreshToken();
        // Guardar refresh token
        await prisma.seg_refresh_tokens.create({
            data: {
                usuario_id: result.usuario.id,
                token: refreshToken,
                expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                revocado: false,
            },
        });
        return {
            user: {
                id: result.usuario.id,
                email: result.usuario.email,
            },
            accessToken,
            refreshToken,
        };
    }
    async login(data) {
        const usuario = await prisma.seg_usuarios.findUnique({
            where: { email: data.email },
            include: {
                usuario_roles: {
                    include: {
                        rol: true,
                    },
                },
            },
        });
        if (!usuario) {
            throw new errorHandler_1.AppError('Credenciales inválidas', 401);
        }
        if (!usuario.activo) {
            throw new errorHandler_1.AppError('Usuario desactivado', 401);
        }
        // En este proyecto (modo demo), permitimos login aun si el correo no fue verificado.
        const isValidPassword = await this.comparePassword(data.password, usuario.password_hash);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError('Credenciales inválidas', 401);
        }
        // Actualizar último login
        await prisma.seg_usuarios.update({
            where: { id: usuario.id },
            data: { fecha_ultimo_login: new Date() },
        });
        // Generar tokens
        const accessToken = this.generateAccessToken(usuario.id, usuario.email);
        const refreshToken = this.generateRefreshToken();
        // Guardar refresh token
        await prisma.seg_refresh_tokens.create({
            data: {
                usuario_id: usuario.id,
                token: refreshToken,
                expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                revocado: false,
            },
        });
        return {
            user: {
                id: usuario.id,
                email: usuario.email,
                roles: usuario.usuario_roles.map((ur) => ur.rol.nombre),
            },
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(refreshToken) {
        const tokenRecord = await prisma.seg_refresh_tokens.findFirst({
            where: {
                token: refreshToken,
                revocado: false,
                expira_en: { gt: new Date() },
            },
            include: {
                usuario: {
                    include: {
                        usuario_roles: {
                            include: {
                                rol: true,
                            },
                        },
                    },
                },
            },
        });
        if (!tokenRecord) {
            throw new errorHandler_1.AppError('Refresh token inválido o expirado', 401);
        }
        // Revocar el refresh token usado
        await prisma.seg_refresh_tokens.update({
            where: { id: tokenRecord.id },
            data: { revocado: true },
        });
        // Generar nuevos tokens
        const accessToken = this.generateAccessToken(tokenRecord.usuario.id, tokenRecord.usuario.email);
        const newRefreshToken = this.generateRefreshToken();
        await prisma.seg_refresh_tokens.create({
            data: {
                usuario_id: tokenRecord.usuario.id,
                token: newRefreshToken,
                expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                revocado: false,
            },
        });
        return {
            user: {
                id: tokenRecord.usuario.id,
                email: tokenRecord.usuario.email,
                roles: tokenRecord.usuario.usuario_roles.map((ur) => ur.rol.nombre),
            },
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    async logout(userId, refreshToken) {
        await prisma.seg_refresh_tokens.updateMany({
            where: {
                usuario_id: userId,
                token: refreshToken,
            },
            data: { revocado: true },
        });
        return { success: true };
    }
    async verifyEmail(token) {
        const usuario = await prisma.seg_usuarios.findFirst({
            where: { token_verificacion: token },
        });
        if (!usuario) {
            throw new errorHandler_1.AppError('Token de verificación inválido', 400);
        }
        await prisma.seg_usuarios.update({
            where: { id: usuario.id },
            data: {
                email_verificado: true,
                token_verificacion: null,
            },
        });
        return { success: true };
    }
    async forgotPassword(email) {
        const usuario = await prisma.seg_usuarios.findUnique({
            where: { email },
        });
        if (!usuario) {
            // No revelar si el email existe por seguridad
            return { success: true };
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        await prisma.seg_usuarios.update({
            where: { id: usuario.id },
            data: {
                token_verificacion: resetToken,
            },
        });
        await (0, email_1.sendPasswordResetEmail)(email, resetToken);
        return { success: true };
    }
    async resetPassword(token, newPassword) {
        const usuario = await prisma.seg_usuarios.findFirst({
            where: { token_verificacion: token },
        });
        if (!usuario) {
            throw new errorHandler_1.AppError('Token inválido o expirado', 400);
        }
        const hashedPassword = await this.hashPassword(newPassword);
        await prisma.seg_usuarios.update({
            where: { id: usuario.id },
            data: {
                password_hash: hashedPassword,
                token_verificacion: null,
            },
        });
        return { success: true };
    }
}
exports.AuthService = AuthService;
