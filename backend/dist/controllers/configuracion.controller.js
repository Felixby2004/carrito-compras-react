"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracionController = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const CLAVE_TEMA = 'tema_sistema';
const temaSchema = zod_1.z.object({
    colorPrimario: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color primario inválido'),
    colorSecundario: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color secundario inválido'),
    colorAcento: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color acento inválido'),
});
const temaDefault = {
    colorPrimario: '#2563eb',
    colorSecundario: '#0f172a',
    colorAcento: '#f59e0b',
};
class ConfiguracionController {
    async getTemaPublico(_req, res, next) {
        try {
            const config = await prisma.configuracion_sistema.findUnique({ where: { clave: CLAVE_TEMA } });
            const tema = config ? JSON.parse(config.valor) : temaDefault;
            res.json({ success: true, data: tema });
        }
        catch (error) {
            next(error);
        }
    }
    async getTemaAdmin(req, res, next) {
        try {
            if (!req.user)
                throw new errorHandler_1.AppError('No autenticado', 401);
            const config = await prisma.configuracion_sistema.findUnique({ where: { clave: CLAVE_TEMA } });
            const tema = config ? JSON.parse(config.valor) : temaDefault;
            res.json({ success: true, data: tema });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTema(req, res, next) {
        try {
            if (!req.user)
                throw new errorHandler_1.AppError('No autenticado', 401);
            const data = temaSchema.parse(req.body);
            const saved = await prisma.configuracion_sistema.upsert({
                where: { clave: CLAVE_TEMA },
                update: { valor: JSON.stringify(data), descripcion: 'Colores del tema del sistema' },
                create: {
                    clave: CLAVE_TEMA,
                    valor: JSON.stringify(data),
                    descripcion: 'Colores del tema del sistema',
                },
            });
            res.json({ success: true, message: 'Configuración guardada', data: JSON.parse(saved.valor) });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ConfiguracionController = ConfiguracionController;
