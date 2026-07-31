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
    logoUrl: zod_1.z.string().optional().nullable(),
    nombreTienda: zod_1.z.string().optional().nullable(),
});
const temaDefault = {
    colorPrimario: '#2563eb',
    colorSecundario: '#0f172a',
    colorAcento: '#f59e0b',
    logoUrl: '/logo.png',
    nombreTienda: 'NexTouch LLC',
};
const normalizeNombreTienda = (nombreTienda) => {
    if (!nombreTienda)
        return undefined;
    return (nombreTienda === 'E-Commerce' || nombreTienda === 'eMarket Perú') ? 'NexTouch LLC' : nombreTienda;
};
const normalizeTema = (tema) => {
    if (!tema)
        return tema;
    return {
        ...tema,
        logoUrl: (tema.logoUrl && !tema.logoUrl.includes('norte') && !tema.logoUrl.includes('emarket')) ? tema.logoUrl : '/logo.png',
        nombreTienda: normalizeNombreTienda(tema.nombreTienda) ?? tema.nombreTienda,
    };
};
class ConfiguracionController {
    async getTemaPublico(_req, res, next) {
        try {
            const config = await prisma.configuracion_sistema.findUnique({
                where: { clave: CLAVE_TEMA },
                select: { valor: true },
            });
            const tema = config ? normalizeTema({ ...temaDefault, ...JSON.parse(config.valor) }) : temaDefault;
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
            const config = await prisma.configuracion_sistema.findUnique({
                where: { clave: CLAVE_TEMA },
                select: { valor: true },
            });
            const tema = config ? normalizeTema({ ...temaDefault, ...JSON.parse(config.valor) }) : temaDefault;
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
            const normalizedData = {
                ...data,
                nombreTienda: normalizeNombreTienda(data.nombreTienda) ?? data.nombreTienda,
            };
            const saved = await prisma.configuracion_sistema.upsert({
                where: { clave: CLAVE_TEMA },
                update: { valor: JSON.stringify(normalizedData), descripcion: 'Colores y configuración del tema del sistema' },
                create: {
                    clave: CLAVE_TEMA,
                    valor: JSON.stringify(normalizedData),
                    descripcion: 'Colores y configuración del tema del sistema',
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
