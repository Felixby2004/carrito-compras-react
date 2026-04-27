import { Router } from 'express';
import { OrdenController } from '../controllers/orden.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const ordenController = new OrdenController();

// Ruta pública para crear orden (invitados también pueden)
router.post('/', ordenController.crearOrden.bind(ordenController));

// Rutas protegidas - las más específicas primero
router.get('/mis-ordenes', authenticate, ordenController.getMisOrdenes.bind(ordenController));
router.get('/mis-ordenes/:id', authenticate, ordenController.getMiOrdenById.bind(ordenController));
router.put('/mis-ordenes/:id/cancelar', authenticate, ordenController.cancelarMiOrden.bind(ordenController));
router.get('/mis-ordenes/:id/tracking', authenticate, ordenController.getTracking.bind(ordenController));
router.get('/mis-ordenes/:id/factura', authenticate, ordenController.descargarFactura.bind(ordenController));

// Rutas admin
router.get('/admin', authenticate, requirePermission('ordenes', 'leer'), ordenController.getOrdenesAdmin.bind(ordenController));
router.put('/admin/:id/estado', authenticate, requirePermission('ordenes', 'editar'), ordenController.cambiarEstado.bind(ordenController));
router.get('/admin/estadisticas', authenticate, requirePermission('ordenes', 'leer'), ordenController.getEstadisticasOrdenes.bind(ordenController));
router.get('/admin/:id/documentos/:tipo', authenticate, requirePermission('ordenes', 'leer'), ordenController.imprimirDocumentoAdmin.bind(ordenController));

// Rutas genéricas al final
router.get('/:id', authenticate, ordenController.getOrdenById.bind(ordenController));

export default router;