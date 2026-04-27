"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orden_controller_1 = require("../controllers/orden.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
const ordenController = new orden_controller_1.OrdenController();
// Ruta pública para crear orden (invitados también pueden)
router.post('/', ordenController.crearOrden.bind(ordenController));
// Rutas protegidas - las más específicas primero
router.get('/mis-ordenes', auth_middleware_1.authenticate, ordenController.getMisOrdenes.bind(ordenController));
router.get('/mis-ordenes/:id', auth_middleware_1.authenticate, ordenController.getMiOrdenById.bind(ordenController));
router.put('/mis-ordenes/:id/cancelar', auth_middleware_1.authenticate, ordenController.cancelarMiOrden.bind(ordenController));
router.get('/mis-ordenes/:id/tracking', auth_middleware_1.authenticate, ordenController.getTracking.bind(ordenController));
router.get('/mis-ordenes/:id/factura', auth_middleware_1.authenticate, ordenController.descargarFactura.bind(ordenController));
// Rutas admin
router.get('/admin', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('ordenes', 'leer'), ordenController.getOrdenesAdmin.bind(ordenController));
router.put('/admin/:id/estado', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('ordenes', 'editar'), ordenController.cambiarEstado.bind(ordenController));
router.get('/admin/estadisticas', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('ordenes', 'leer'), ordenController.getEstadisticasOrdenes.bind(ordenController));
router.get('/admin/:id/documentos/:tipo', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('ordenes', 'leer'), ordenController.imprimirDocumentoAdmin.bind(ordenController));
// Rutas genéricas al final
router.get('/:id', auth_middleware_1.authenticate, ordenController.getOrdenById.bind(ordenController));
exports.default = router;
