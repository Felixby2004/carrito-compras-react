"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarritoController = void 0;
const carrito_service_1 = require("../services/carrito.service");
const carrito_schema_1 = require("../schemas/carrito.schema");
const carritoService = new carrito_service_1.CarritoService();
class CarritoController {
    getSessionId(req) {
        // Intentar obtener del header X-Session-Id
        let sessionId = req.headers['x-session-id'];
        // Si no hay sessionId en header, generar uno nuevo
        if (!sessionId) {
            sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
        }
        return sessionId;
    }
    async getCarrito(req, res, next) {
        try {
            const usuarioId = req.user?.id || null;
            const sessionId = !usuarioId ? this.getSessionId(req) : null;
            const carrito = await carritoService.getCarrito(usuarioId, sessionId);
            res.json({
                success: true,
                data: carrito,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async addToCart(req, res, next) {
        try {
            const usuarioId = req.user?.id || null;
            const sessionId = !usuarioId ? this.getSessionId(req) : null;
            const data = carrito_schema_1.addToCartSchema.parse(req.body);
            const carrito = await carritoService.addToCart(usuarioId, sessionId, data);
            res.json({
                success: true,
                data: carrito,
                message: 'Producto agregado al carrito',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCartItem(req, res, next) {
        try {
            const usuarioId = req.user?.id || null;
            const sessionId = !usuarioId ? this.getSessionId(req) : null;
            const itemId = parseInt(req.params.itemId);
            const { cantidad } = carrito_schema_1.updateCartItemSchema.parse(req.body);
            const carrito = await carritoService.updateCartItem(usuarioId, sessionId, itemId, cantidad);
            res.json({
                success: true,
                data: carrito,
                message: cantidad === 0 ? 'Item eliminado del carrito' : 'Carrito actualizado',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async removeCartItem(req, res, next) {
        try {
            const usuarioId = req.user?.id || null;
            const sessionId = !usuarioId ? this.getSessionId(req) : null;
            const itemId = parseInt(req.params.itemId);
            const carrito = await carritoService.removeCartItem(usuarioId, sessionId, itemId);
            res.json({
                success: true,
                data: carrito,
                message: 'Item eliminado del carrito',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async clearCart(req, res, next) {
        try {
            const usuarioId = req.user?.id || null;
            const sessionId = !usuarioId ? this.getSessionId(req) : null;
            const carrito = await carritoService.clearCart(usuarioId, sessionId);
            res.json({
                success: true,
                data: carrito,
                message: 'Carrito vaciado',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async mergeCart(req, res, next) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) {
                res.json({ success: true, data: null });
                return;
            }
            const carrito = await carritoService.mergeCart(req.user.id, sessionId);
            res.json({
                success: true,
                data: carrito,
                message: 'Carrito sincronizado',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CarritoController = CarritoController;
