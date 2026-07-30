import { Router } from 'express';
import { ProductoController, uploadCloudinary } from '../controllers/producto.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const productoController = new ProductoController();

// Rutas de imágenes sin ID de producto (deben ir ANTES de /:id para evitar capturar "imagenes" como parametro)
router.put(
  '/imagenes/:imagenId/principal',
  authenticate,
  requirePermission('productos', 'editar'),
  productoController.setImagenPrincipal.bind(productoController)
);

router.delete(
  '/imagenes/:imagenId',
  authenticate,
  requirePermission('productos', 'editar'),
  productoController.eliminarImagen.bind(productoController)
);

// Rutas públicas estáticas
router.get('/', productoController.getProductos.bind(productoController));
router.get('/destacados', productoController.getDestacados.bind(productoController));
router.get('/ofertas', productoController.getOfertas.bind(productoController));
router.get('/nuevos', productoController.getNuevos.bind(productoController));
router.get('/todos', authenticate, requirePermission('productos', 'leer'), productoController.getTodosProductos.bind(productoController));
router.get('/categorias/con-productos', productoController.getCategorias.bind(productoController));
router.get('/categorias', productoController.getCategorias.bind(productoController));
router.get('/subcategorias', productoController.getSubcategorias.bind(productoController));
router.get('/marcas', productoController.getMarcas.bind(productoController));
router.get('/unidades-medida', productoController.getUnidadesMedida.bind(productoController));
router.get('/atributos', productoController.getAtributos.bind(productoController));

// Rutas públicas parametrizadas
router.get('/:id/relacionados', productoController.getRelacionados.bind(productoController));
router.get('/:id/imagenes', productoController.getImagenes.bind(productoController));
router.get('/:id', productoController.getProductoById.bind(productoController));

// Rutas protegidas por ID de producto
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

// Subida de imágenes asociadas a un producto
router.post(
  '/:id/imagenes',
  authenticate,
  requirePermission('productos', 'editar'),
  uploadCloudinary.array('imagenes', 10),
  productoController.subirImagenes.bind(productoController)
);

router.post(
  '/:id/imagenes/url',
  authenticate,
  requirePermission('productos', 'editar'),
  productoController.agregarImagenUrl.bind(productoController)
);

export default router;