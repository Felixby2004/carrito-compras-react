"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuponService = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const prisma = new client_1.PrismaClient();
class CuponService {
    // Validar un cupón
    async validarCupon(codigo, montoSubtotal, usuarioId) {
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
        // Validar uso máximo
        if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
            throw new errorHandler_1.AppError('El cupón ya alcanzó su límite de usos', 400);
        }
        // Validar monto mínimo
        if (cupon.monto_minimo && montoSubtotal < Number(cupon.monto_minimo)) {
            throw new errorHandler_1.AppError(`El monto mínimo para este cupón es S/ ${Number(cupon.monto_minimo).toFixed(2)}`, 400);
        }
        // Calcular descuento
        let descuento = 0;
        if (cupon.tipo === 'porcentaje') {
            descuento = montoSubtotal * (Number(cupon.valor) / 100);
        }
        else {
            descuento = Number(cupon.valor);
        }
        // El descuento no puede ser mayor al subtotal
        if (descuento > montoSubtotal) {
            descuento = montoSubtotal;
        }
        return {
            cupon,
            descuento,
            valido: true,
        };
    }
    // Aplicar cupón a un carrito (sin guardar aún)
    async aplicarCupon(codigo, subtotal, usuarioId) {
        const resultado = await this.validarCupon(codigo, subtotal, usuarioId);
        return resultado;
    }
    // Registrar uso de cupón (cuando se confirma la orden)
    async registrarUso(cuponId) {
        await prisma.ord_cupones.update({
            where: { id: cuponId },
            data: { usos_actuales: { increment: 1 } },
        });
    }
    // Obtener cupones disponibles (para admin)
    async getCupones(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [cupones, total] = await Promise.all([
            prisma.ord_cupones.findMany({
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            prisma.ord_cupones.count(),
        ]);
        return {
            data: cupones,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    // Crear cupón (admin)
    async crearCupon(data) {
        const existing = await prisma.ord_cupones.findUnique({
            where: { codigo: data.codigo.toUpperCase() },
        });
        if (existing) {
            throw new errorHandler_1.AppError('El código de cupón ya existe', 409);
        }
        const cupon = await prisma.ord_cupones.create({
            data: {
                codigo: data.codigo.toUpperCase(),
                tipo: data.tipo,
                valor: data.valor,
                fecha_inicio: new Date(data.fecha_inicio),
                fecha_fin: new Date(data.fecha_fin),
                monto_minimo: data.monto_minimo ? Number(data.monto_minimo) : null,
                usos_maximos: data.usos_maximos ? Number(data.usos_maximos) : null,
                activo: true,
            },
        });
        return cupon;
    }
    // Actualizar cupón (admin)
    async actualizarCupon(id, data) {
        const cupon = await prisma.ord_cupones.findUnique({ where: { id } });
        if (!cupon) {
            throw new errorHandler_1.AppError('Cupón no encontrado', 404);
        }
        const updated = await prisma.ord_cupones.update({
            where: { id },
            data: {
                tipo: data.tipo,
                valor: data.valor,
                fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : undefined,
                fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : undefined,
                monto_minimo: data.monto_minimo ? Number(data.monto_minimo) : undefined,
                usos_maximos: data.usos_maximos ? Number(data.usos_maximos) : undefined,
                activo: data.activo,
            },
        });
        return updated;
    }
    // Eliminar cupón (admin)
    async eliminarCupon(id) {
        await prisma.ord_cupones.delete({ where: { id } });
        return { success: true };
    }
}
exports.CuponService = CuponService;
