"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const carrito_controller_1 = require("../controllers/carrito.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const carritoController = new carrito_controller_1.CarritoController();
router.get('/', carritoController.getCarrito.bind(carritoController));
router.post('/items', carritoController.addToCart.bind(carritoController));
router.put('/items/:itemId', carritoController.updateCartItem.bind(carritoController));
router.delete('/items/:itemId', carritoController.removeCartItem.bind(carritoController));
router.delete('/', carritoController.clearCart.bind(carritoController));
// Solo el merge requiere autenticación
router.post('/merge', auth_middleware_1.authenticate, carritoController.mergeCart.bind(carritoController));
exports.default = router;
