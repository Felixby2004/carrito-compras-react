import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const dashboardController = new DashboardController();

// Todas las rutas del dashboard requieren autenticación y permisos de admin
router.use(authenticate);

// Resumen general del dashboard
router.get('/resumen', requirePermission('dashboard', 'leer'), dashboardController.getResumenGeneral.bind(dashboardController));

// Estadísticas de órdenes
router.get('/ordenes/estadisticas', requirePermission('ordenes', 'leer'), dashboardController.getEstadisticasOrdenes.bind(dashboardController));

// Productos más vendidos
router.get('/productos/top-vendidos', requirePermission('productos', 'leer'), dashboardController.getProductosMasVendidos.bind(dashboardController));

// Estado del inventario
router.get('/inventario/estado', requirePermission('inventario', 'leer'), dashboardController.getEstadoInventario.bind(dashboardController));

// Movimientos del inventario
router.get('/inventario/movimientos', requirePermission('inventario', 'leer'), dashboardController.getMovimientosInventario.bind(dashboardController));

// Clientes recientes
router.get('/clientes/recientes', requirePermission('clientes', 'leer'), dashboardController.getClientesRecientes.bind(dashboardController));

// Métricas de rendimiento
router.get('/metricas/rendimiento', requirePermission('dashboard', 'leer'), dashboardController.getMetricasRendimiento.bind(dashboardController));
router.get('/analytics', dashboardController.getAdvancedAnalytics.bind(dashboardController));

export default router;
