import { Router } from 'express';
import { ProductoController, upload } from '../controllers/producto.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const productoController = new ProductoController();

// Rutas públicas
router.get('/', productoController.getProductos.bind(productoController));
router.get('/destacados', productoController.getDestacados.bind(productoController));
router.get('/ofertas', productoController.getOfertas.bind(productoController));
router.get('/nuevos', productoController.getNuevos.bind(productoController));
router.get('/todos', productoController.getTodosProductos.bind(productoController));
router.get('/categorias', productoController.getCategorias.bind(productoController));
router.get('/subcategorias', productoController.getSubcategorias.bind(productoController));
router.get('/marcas', productoController.getMarcas.bind(productoController));
router.get('/:id/relacionados', productoController.getRelacionados.bind(productoController));
router.get('/:id/imagenes', productoController.getImagenes.bind(productoController));
router.get('/:id', productoController.getProductoById.bind(productoController));

// Rutas protegidas
router.post('/',
  authenticate,
  requirePermission('productos', 'crear'),
  productoController.createProducto.bind(productoController)
);

router.put('/:id',
  authenticate,
  requirePermission('productos', 'editar'),
  productoController.updateProducto.bind(productoController)
);

router.delete('/:id',
  authenticate,
  requirePermission('productos', 'eliminar'),
  productoController.deleteProducto.bind(productoController)
);

// Rutas para imágenes (requieren autenticación)
router.post(
  '/:id/imagenes',
  authenticate,
  requirePermission('productos', 'editar'),
  upload.array('imagenes', 10),
  productoController.subirImagenes.bind(productoController)
);

router.put(
  '/imagenes/:imagenId/principal',
  authenticate,
  requirePermission('productos', 'editar'),
  productoController.setImagenPrincipal.bind(productoController)
);

router.get(
  '/:id/imagenes',
  productoController.getImagenes.bind(productoController)
);

router.delete(
  '/imagenes/:imagenId',
  authenticate,
  requirePermission('productos', 'editar'),
  productoController.eliminarImagen.bind(productoController)
);

export default router;