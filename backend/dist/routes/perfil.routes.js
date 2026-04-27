"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const perfil_controller_1 = require("../controllers/perfil.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const perfilController = new perfil_controller_1.PerfilController();
// Todas las rutas requieren autenticación
router.use(auth_middleware_1.authenticate);
// Perfil del usuario
router.get('/', perfilController.obtenerPerfil.bind(perfilController));
router.put('/', perfilController.actualizarPerfil.bind(perfilController));
router.post('/cambiar-password', perfilController.cambiarPassword.bind(perfilController));
// Historial de compras
router.get('/historial-compras', perfilController.obtenerHistorialCompras.bind(perfilController));
// Dirección de envío
router.get('/direcciones', perfilController.obtenerDirecciones.bind(perfilController));
router.post('/direcciones', perfilController.crearDireccion.bind(perfilController));
router.put('/direcciones/:id', perfilController.actualizarDireccion.bind(perfilController));
router.delete('/direcciones/:id', perfilController.eliminarDireccion.bind(perfilController));
// Lista de deseos
router.get('/lista-deseos', perfilController.obtenerListaDeseos.bind(perfilController));
router.post('/lista-deseos', perfilController.anadirAListaDeseos.bind(perfilController));
router.delete('/lista-deseos/:id', perfilController.eliminarDeListaDeseos.bind(perfilController));
router.post('/lista-deseos/:id/mover-carrito', perfilController.moverACarrito.bind(perfilController));
router.get('/preferencias-notificacion', perfilController.obtenerPreferenciasNotificacion.bind(perfilController));
router.put('/preferencias-notificacion', perfilController.actualizarPreferenciasNotificacion.bind(perfilController));
exports.default = router;
