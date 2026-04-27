"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventario_controller_1 = require("../controllers/inventario.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
const inventarioController = new inventario_controller_1.InventarioController();
// Todas las rutas requieren autenticación
router.use(auth_middleware_1.authenticate);
// Stock de productos
router.get('/stock', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), inventarioController.getStock.bind(inventarioController));
router.get('/stock/:id', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), inventarioController.getStockProducto.bind(inventarioController));
router.put('/stock/:id/ajustar', (0, rbac_middleware_1.requirePermission)('inventario', 'editar'), inventarioController.ajustarStock.bind(inventarioController));
// Ajustes de inventario (POST endpoint)
router.post('/ajustes', (0, rbac_middleware_1.requirePermission)('inventario', 'editar'), inventarioController.realizarAjuste.bind(inventarioController));
// Movimientos de inventario
router.post('/movimientos', (0, rbac_middleware_1.requirePermission)('inventario', 'editar'), inventarioController.registrarMovimiento.bind(inventarioController));
router.get('/movimientos', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), inventarioController.getMovimientos.bind(inventarioController));
// Productos con bajo stock
router.get('/bajo-stock', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), inventarioController.getProductosBajoStock.bind(inventarioController));
// Proveedores
router.get('/proveedores', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), inventarioController.getProveedores.bind(inventarioController));
router.post('/proveedores', (0, rbac_middleware_1.requirePermission)('inventario', 'crear'), inventarioController.createProveedor.bind(inventarioController));
router.put('/proveedores/:id', (0, rbac_middleware_1.requirePermission)('inventario', 'editar'), inventarioController.updateProveedor.bind(inventarioController));
// Órdenes de compra
router.post('/ordenes-compra', (0, rbac_middleware_1.requirePermission)('inventario', 'crear'), inventarioController.crearOrdenCompra.bind(inventarioController));
router.get('/ordenes-compra', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), inventarioController.getOrdenesCompra.bind(inventarioController));
router.put('/ordenes-compra/:id/estado', (0, rbac_middleware_1.requirePermission)('inventario', 'editar'), inventarioController.actualizarEstadoOrdenCompra.bind(inventarioController));
router.post('/ordenes-compra/:id/recibir', (0, rbac_middleware_1.requirePermission)('inventario', 'editar'), inventarioController.recibirMercaderia.bind(inventarioController));
router.get('/cuentas-por-pagar', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), inventarioController.getCuentasPorPagar.bind(inventarioController));
exports.default = router;
