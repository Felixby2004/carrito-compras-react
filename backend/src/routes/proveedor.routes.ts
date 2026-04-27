import { Router } from 'express';
import { ProveedorController } from '../controllers/proveedor.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const proveedorController = new ProveedorController();

// Rutas públicas
router.get('/', proveedorController.obtenerProveedores.bind(proveedorController));
router.get('/:id', proveedorController.obtenerProveedor.bind(proveedorController));

// Rutas protegidas (requieren autenticación)
router.post('/',
  authenticate,
  requirePermission('inventario', 'crear'),
  proveedorController.crearProveedor.bind(proveedorController)
);

router.put('/:id',
  authenticate,
  requirePermission('inventario', 'actualizar'),
  proveedorController.actualizarProveedor.bind(proveedorController)
);

router.delete('/:id',
  authenticate,
  requirePermission('inventario', 'eliminar'),
  proveedorController.eliminarProveedor.bind(proveedorController)
);

export default router;
