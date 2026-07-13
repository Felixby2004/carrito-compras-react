"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const carrito_controller_1 = require("../controllers/carrito.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const carritoController = new carrito_controller_1.CarritoController();
router.get('/', auth_middleware_1.optionalAuthenticate, carritoController.getCarrito.bind(carritoController));
router.post('/items', auth_middleware_1.optionalAuthenticate, carritoController.addToCart.bind(carritoController));
router.put('/items/:itemId', auth_middleware_1.optionalAuthenticate, carritoController.updateCartItem.bind(carritoController));
router.delete('/items/:itemId', auth_middleware_1.optionalAuthenticate, carritoController.removeCartItem.bind(carritoController));
router.delete('/', auth_middleware_1.optionalAuthenticate, carritoController.clearCart.bind(carritoController));
// Solo el merge requiere autenticación
router.post('/merge', auth_middleware_1.authenticate, carritoController.mergeCart.bind(carritoController));
exports.default = router;
