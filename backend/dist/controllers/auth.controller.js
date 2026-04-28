"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const auth_schema_1 = require("../schemas/auth.schema");
const errorHandler_1 = require("../middlewares/errorHandler");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res, next) {
        try {
            const data = auth_schema_1.registerSchema.parse(req.body);
            const result = await authService.register(data);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Usuario registrado exitosamente. Revise su email para verificar la cuenta.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const data = auth_schema_1.loginSchema.parse(req.body);
            const result = await authService.login(data);
            res.json({
                success: true,
                data: result,
                message: 'Login exitoso',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = auth_schema_1.refreshTokenSchema.parse(req.body);
            const result = await authService.refreshToken(refreshToken);
            res.json({
                success: true,
                data: result,
                message: 'Token refrescado exitosamente',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new errorHandler_1.AppError('Refresh token requerido', 400);
            }
            const result = await authService.logout(req.user.id, refreshToken);
            res.json({
                success: true,
                data: result,
                message: 'Logout exitoso',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const { token } = req.query;
            if (!token || typeof token !== 'string') {
                throw new errorHandler_1.AppError('Token requerido', 400);
            }
            await authService.verifyEmail(token);
            res.json({
                success: true,
                message: 'Email verificado exitosamente',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                throw new errorHandler_1.AppError('Email requerido', 400);
            }
            await authService.forgotPassword(email);
            res.json({
                success: true,
                message: 'Si el email existe, recibirá instrucciones para resetear su contraseña',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                throw new errorHandler_1.AppError('Token y nueva contraseña requeridos', 400);
            }
            await authService.resetPassword(token, newPassword);
            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            res.json({
                success: true,
                data: req.user,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
