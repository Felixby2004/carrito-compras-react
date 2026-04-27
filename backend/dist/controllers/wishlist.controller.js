"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistController = void 0;
const errorHandler_1 = require("../middlewares/errorHandler");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class WishlistController {
    // Obtener lista de deseos del usuario
    async getWishlist(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('No autenticado', 401);
            }
            const cliente = await prisma.cli_clientes.findUnique({
                where: { usuario_id: req.user.id },
            });
            if (!cliente) {
                throw new errorHandler_1.AppError('Cliente no encontrado', 404);
            }
            const wishlist = await prisma.cli_lista_deseos.findFirst({
                where: { cliente_id: cliente.id },
                include: {
                    items: {
                        include: {
                            producto: {
                                include: {
                                    imagenes: {
                                        where: { es_principal: true },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            });
            res.json({ success: true, data: wishlist?.items || [] });
        }
        catch (error) {
            next(error);
        }
    }
    // Agregar producto a lista de deseos
    async addToWishlist(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('No autenticado', 401);
            }
            const productoIdRaw = req.body?.productoId ?? req.body?.producto_id;
            const productoId = Number(productoIdRaw);
            if (!productoId || Number.isNaN(productoId)) {
                throw new errorHandler_1.AppError('Producto ID requerido', 400);
            }
            const cliente = await prisma.cli_clientes.findUnique({
                where: { usuario_id: req.user.id },
            });
            if (!cliente) {
                throw new errorHandler_1.AppError('Cliente no encontrado', 404);
            }
            let wishlist = await prisma.cli_lista_deseos.findFirst({
                where: { cliente_id: cliente.id },
            });
            if (!wishlist) {
                wishlist = await prisma.cli_lista_deseos.create({
                    data: {
                        cliente_id: cliente.id,
                        nombre_lista: 'Mi lista',
                    },
                });
            }
            // Verificar si ya existe
            const existe = await prisma.cli_items_lista_deseos.findFirst({
                where: {
                    lista_id: wishlist.id,
                    producto_id: productoId,
                },
            });
            if (existe) {
                throw new errorHandler_1.AppError('Producto ya está en tu lista de deseos', 409);
            }
            await prisma.cli_items_lista_deseos.create({
                data: {
                    lista_id: wishlist.id,
                    producto_id: productoId,
                },
            });
            res.json({ success: true, message: 'Producto agregado a tu lista de deseos' });
        }
        catch (error) {
            next(error);
        }
    }
    // Eliminar producto de lista de deseos
    async removeFromWishlist(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('No autenticado', 401);
            }
            const { productoId } = req.params;
            const cliente = await prisma.cli_clientes.findUnique({
                where: { usuario_id: req.user.id },
            });
            if (!cliente) {
                throw new errorHandler_1.AppError('Cliente no encontrado', 404);
            }
            const wishlist = await prisma.cli_lista_deseos.findFirst({
                where: { cliente_id: cliente.id },
            });
            if (!wishlist) {
                throw new errorHandler_1.AppError('Lista de deseos no encontrada', 404);
            }
            await prisma.cli_items_lista_deseos.deleteMany({
                where: {
                    lista_id: wishlist.id,
                    producto_id: parseInt(productoId),
                },
            });
            res.json({ success: true, message: 'Producto eliminado de tu lista de deseos' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WishlistController = WishlistController;
