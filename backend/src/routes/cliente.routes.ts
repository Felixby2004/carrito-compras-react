import { Router } from 'express';
import { ClienteController } from '../controllers/cliente.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const clienteController = new ClienteController();

// Rutas para el propio cliente
router.get('/mis-direcciones', authenticate, clienteController.getMisDirecciones.bind(clienteController));
router.post('/direcciones', authenticate, clienteController.crearDireccion.bind(clienteController));

// Rutas admin - las más específicas primero
router.get('/admin/estadisticas', authenticate, requirePermission('clientes', 'leer'), clienteController.getEstadisticas.bind(clienteController));
router.get('/admin', authenticate, requirePermission('clientes', 'leer'), clienteController.getClientesAdmin.bind(clienteController));
router.get('/:id', authenticate, requirePermission('clientes', 'leer'), clienteController.getClienteById.bind(clienteController));
router.put('/:id/estado', authenticate, requirePermission('clientes', 'editar'), clienteController.cambiarEstado.bind(clienteController));

export default router;