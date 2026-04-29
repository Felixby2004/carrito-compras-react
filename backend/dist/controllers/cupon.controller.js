"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuponController = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const zod_1 = require("zod");
const cupon_service_1 = require("../services/cupon.service");
const prisma = new client_1.PrismaClient();
const cuponService = new cupon_service_1.CuponService();
const validarCuponSchema = zod_1.z.object({
    codigo: zod_1.z.string().min(1),
    subtotal: zod_1.z.number().min(0),
});
const crudCuponSchema = zod_1.z.object({
    codigo: zod_1.z.string().min(3).optional(),
    tipo: zod_1.z.enum(['porcentaje', 'fijo']).optional(),
    valor: zod_1.z.number().min(0).optional(),
    fecha_inicio: zod_1.z.string().optional(),
    fecha_fin: zod_1.z.string().optional(),
    monto_minimo: zod_1.z.number().min(0).nullable().optional(),
    usos_maximos: zod_1.z.number().int().min(1).nullable().optional(),
    activo: zod_1.z.boolean().optional(),
});
class CuponController {
    async validarCupon(req, res, next) {
        try {
            const { codigo, subtotal } = validarCuponSchema.parse(req.body);
            const cupon = await prisma.ord_cupones.findFirst({
                where: {
                    codigo: codigo.toUpperCase(),
                    activo: true,
                    fecha_inicio: { lte: new Date() },
                    fecha_fin: { gte: new Date() },
                },
            });
            if (!cupon) {
                throw new errorHandler_1.AppError('Cupón inválido o expirado', 400);
            }
            if (cupon.monto_minimo && subtotal < Number(cupon.monto_minimo)) {
                throw new errorHandler_1.AppError(`El monto mínimo para usar este cupón es S/ ${Number(cupon.monto_minimo).toFixed(2)}`, 400);
            }
            if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
                throw new errorHandler_1.AppError('El cupón ha alcanzado su límite de usos', 400);
            }
            let descuento = 0;
            if (cupon.tipo === 'porcentaje') {
                descuento = subtotal * (Number(cupon.valor) / 100);
            }
            else {
                descuento = Number(cupon.valor);
            }
            if (descuento > subtotal) {
                descuento = subtotal;
            }
            res.json({
                success: true,
                data: {
                    codigo: cupon.codigo,
                    descuento,
                    tipo: cupon.tipo,
                    valor: Number(cupon.valor),
                    monto_minimo: cupon.monto_minimo ? Number(cupon.monto_minimo) : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCuponesAdmin(req, res, next) {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);
            const data = await cuponService.getCupones(page, limit);
            res.json({ success: true, ...data });
        }
        catch (error) {
            next(error);
        }
    }
    async crearCupon(req, res, next) {
        try {
            const payload = crudCuponSchema.parse(req.body);
            if (!payload.codigo || !payload.tipo || !payload.valor || !payload.fecha_inicio || !payload.fecha_fin) {
                throw new errorHandler_1.AppError('Faltan campos requeridos para crear cupón', 400);
            }
            const data = await cuponService.crearCupon(payload);
            res.status(201).json({ success: true, data, message: 'Cupón creado' });
        }
        catch (error) {
            next(error);
        }
    }
    async actualizarCupon(req, res, next) {
        try {
            const id = Number(req.params.id);
            const payload = crudCuponSchema.parse(req.body);
            const data = await cuponService.actualizarCupon(id, payload);
            res.json({ success: true, data, message: 'Cupón actualizado' });
        }
        catch (error) {
            next(error);
        }
    }
    async eliminarCupon(req, res, next) {
        try {
            const id = Number(req.params.id);
            await cuponService.eliminarCupon(id);
            res.json({ success: true, message: 'Cupón eliminado' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CuponController = CuponController;
