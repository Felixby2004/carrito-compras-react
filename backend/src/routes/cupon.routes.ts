import { Router } from 'express';
import { CuponController } from '../controllers/cupon.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const cuponController = new CuponController();

// Ruta pública para validar cupón
router.post('/validar', cuponController.validarCupon.bind(cuponController));
router.get('/', authenticate, requirePermission('cupones', 'leer'), cuponController.getCuponesAdmin.bind(cuponController));
router.post('/', authenticate, requirePermission('cupones', 'crear'), cuponController.crearCupon.bind(cuponController));
router.put('/:id', authenticate, requirePermission('cupones', 'editar'), cuponController.actualizarCupon.bind(cuponController));
router.delete('/:id', authenticate, requirePermission('cupones', 'eliminar'), cuponController.eliminarCupon.bind(cuponController));

export default router;