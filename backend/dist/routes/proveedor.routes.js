"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proveedor_controller_1 = require("../controllers/proveedor.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
const proveedorController = new proveedor_controller_1.ProveedorController();
// Rutas públicas
router.get('/', proveedorController.obtenerProveedores.bind(proveedorController));
router.get('/:id', proveedorController.obtenerProveedor.bind(proveedorController));
// Rutas protegidas (requieren autenticación)
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('inventario', 'crear'), proveedorController.crearProveedor.bind(proveedorController));
router.put('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('inventario', 'actualizar'), proveedorController.actualizarProveedor.bind(proveedorController));
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('inventario', 'eliminar'), proveedorController.eliminarProveedor.bind(proveedorController));
exports.default = router;
