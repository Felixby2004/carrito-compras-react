import { Router } from 'express';
import { InventarioController } from '../controllers/inventario.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const inventarioController = new InventarioController();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Stock de productos
router.get('/stock', requirePermission('inventario', 'leer'), inventarioController.getStock.bind(inventarioController));
router.get('/stock/:id', requirePermission('inventario', 'leer'), inventarioController.getStockProducto.bind(inventarioController));
router.put('/stock/:id/ajustar', requirePermission('inventario', 'editar'), inventarioController.ajustarStock.bind(inventarioController));

// Ajustes de inventario (POST endpoint)
router.post('/ajustes', requirePermission('inventario', 'editar'), inventarioController.realizarAjuste.bind(inventarioController));

// Movimientos de inventario
router.post('/movimientos', requirePermission('inventario', 'editar'), inventarioController.registrarMovimiento.bind(inventarioController));
router.get('/movimientos', requirePermission('inventario', 'leer'), inventarioController.getMovimientos.bind(inventarioController));

// Productos con bajo stock
router.get('/bajo-stock', requirePermission('inventario', 'leer'), inventarioController.getProductosBajoStock.bind(inventarioController));

// Proveedores
router.get('/proveedores', requirePermission('inventario', 'leer'), inventarioController.getProveedores.bind(inventarioController));
router.post('/proveedores', requirePermission('inventario', 'crear'), inventarioController.createProveedor.bind(inventarioController));
router.put('/proveedores/:id', requirePermission('inventario', 'editar'), inventarioController.updateProveedor.bind(inventarioController));

// Órdenes de compra
router.post('/ordenes-compra', requirePermission('inventario', 'crear'), inventarioController.crearOrdenCompra.bind(inventarioController));
router.get('/ordenes-compra', requirePermission('inventario', 'leer'), inventarioController.getOrdenesCompra.bind(inventarioController));
router.put('/ordenes-compra/:id/estado', requirePermission('inventario', 'editar'), inventarioController.actualizarEstadoOrdenCompra.bind(inventarioController));
router.post('/ordenes-compra/:id/recibir', requirePermission('inventario', 'editar'), inventarioController.recibirMercaderia.bind(inventarioController));
router.get('/cuentas-por-pagar', requirePermission('inventario', 'leer'), inventarioController.getCuentasPorPagar.bind(inventarioController));

export default router;
