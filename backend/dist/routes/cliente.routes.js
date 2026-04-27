"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cliente_controller_1 = require("../controllers/cliente.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
const clienteController = new cliente_controller_1.ClienteController();
// Rutas para el propio cliente
router.get('/mis-direcciones', auth_middleware_1.authenticate, clienteController.getMisDirecciones.bind(clienteController));
router.post('/direcciones', auth_middleware_1.authenticate, clienteController.crearDireccion.bind(clienteController));
// Rutas admin - las más específicas primero
router.get('/admin/estadisticas', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('clientes', 'leer'), clienteController.getEstadisticas.bind(clienteController));
router.get('/admin', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('clientes', 'leer'), clienteController.getClientesAdmin.bind(clienteController));
router.get('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('clientes', 'leer'), clienteController.getClienteById.bind(clienteController));
router.put('/:id/estado', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('clientes', 'editar'), clienteController.cambiarEstado.bind(clienteController));
exports.default = router;
