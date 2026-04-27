"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResenaController = void 0;
const errorHandler_1 = require("../middlewares/errorHandler");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ResenaController {
    // Obtener reseñas de un producto
    async getResenasByProducto(req, res, next) {
        try {
            const productoId = parseInt(req.params.productoId);
            const resenas = await prisma.cli_resenas_producto.findMany({
                where: { producto_id: productoId },
                include: {
                    cliente: {
                        include: {
                            usuario: true,
                        },
                    },
                },
                orderBy: { fecha_resena: 'desc' },
            });
            // Calcular promedio
            const promedio = resenas.length > 0
                ? resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length
                : 0;
            res.json({
                success: true,
                data: resenas,
                promedio,
                total: resenas.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Crear una reseña
    async createResena(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('No autenticado', 401);
            }
            const { productoId, calificacion, comentario } = req.body;
            if (!productoId || !calificacion) {
                throw new errorHandler_1.AppError('Producto ID y calificación son requeridos', 400);
            }
            if (calificacion < 1 || calificacion > 5) {
                throw new errorHandler_1.AppError('Calificación debe ser entre 1 y 5', 400);
            }
            const cliente = await prisma.cli_clientes.findUnique({
                where: { usuario_id: req.user.id },
            });
            if (!cliente) {
                throw new errorHandler_1.AppError('Cliente no encontrado', 404);
            }
            // Verificar si ya reseñó este producto
            const existe = await prisma.cli_resenas_producto.findFirst({
                where: {
                    cliente_id: cliente.id,
                    producto_id: productoId,
                },
            });
            if (existe) {
                throw new errorHandler_1.AppError('Ya has reseñado este producto', 409);
            }
            // Solo permitir reseñar si el cliente compró el producto
            const compra = await prisma.ord_items_orden.findFirst({
                where: {
                    producto_id: productoId,
                    orden: {
                        cliente_id: cliente.id,
                        estado: { in: ['pagada', 'en_proceso', 'enviada', 'entregada'] },
                    },
                },
                select: { id: true },
            });
            if (!compra) {
                throw new errorHandler_1.AppError('Solo puedes reseñar productos que hayas comprado', 403);
            }
            const resena = await prisma.cli_resenas_producto.create({
                data: {
                    cliente_id: cliente.id,
                    producto_id: productoId,
                    calificacion,
                    comentario,
                },
            });
            res.json({ success: true, data: resena, message: 'Reseña agregada exitosamente' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ResenaController = ResenaController;
