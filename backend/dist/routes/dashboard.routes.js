"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
const dashboardController = new dashboard_controller_1.DashboardController();
// Todas las rutas del dashboard requieren autenticación y permisos de admin
router.use(auth_middleware_1.authenticate);
// Resumen general del dashboard
router.get('/resumen', (0, rbac_middleware_1.requirePermission)('dashboard', 'leer'), dashboardController.getResumenGeneral.bind(dashboardController));
// Estadísticas de órdenes
router.get('/ordenes/estadisticas', (0, rbac_middleware_1.requirePermission)('ordenes', 'leer'), dashboardController.getEstadisticasOrdenes.bind(dashboardController));
// Productos más vendidos
router.get('/productos/top-vendidos', (0, rbac_middleware_1.requirePermission)('productos', 'leer'), dashboardController.getProductosMasVendidos.bind(dashboardController));
// Estado del inventario
router.get('/inventario/estado', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), dashboardController.getEstadoInventario.bind(dashboardController));
// Movimientos del inventario
router.get('/inventario/movimientos', (0, rbac_middleware_1.requirePermission)('inventario', 'leer'), dashboardController.getMovimientosInventario.bind(dashboardController));
// Clientes recientes
router.get('/clientes/recientes', (0, rbac_middleware_1.requirePermission)('clientes', 'leer'), dashboardController.getClientesRecientes.bind(dashboardController));
// Métricas de rendimiento
router.get('/metricas/rendimiento', (0, rbac_middleware_1.requirePermission)('dashboard', 'leer'), dashboardController.getMetricasRendimiento.bind(dashboardController));
router.get('/analytics', dashboardController.getAdvancedAnalytics.bind(dashboardController));
exports.default = router;
