"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    password_confirmacion: zod_1.z.string().min(6, 'Confirme su contraseña'),
    nombre: zod_1.z.string().min(2, 'El nombre es requerido'),
    apellido: zod_1.z.string().min(2, 'El apellido es requerido'),
    telefono: zod_1.z.string().optional(),
}).refine((data) => data.password === data.password_confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmacion'],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'La contraseña es requerida'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Contraseña actual requerida'),
    newPassword: zod_1.z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});
