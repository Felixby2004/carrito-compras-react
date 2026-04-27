"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const producto_controller_1 = require("../controllers/producto.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
const productoController = new producto_controller_1.ProductoController();
// Rutas públicas
router.get('/', productoController.getProductos.bind(productoController));
router.get('/destacados', productoController.getDestacados.bind(productoController));
router.get('/ofertas', productoController.getOfertas.bind(productoController));
router.get('/nuevos', productoController.getNuevos.bind(productoController));
router.get('/todos', productoController.getTodosProductos.bind(productoController));
router.get('/categorias', productoController.getCategorias.bind(productoController));
router.get('/subcategorias', productoController.getSubcategorias.bind(productoController));
router.get('/marcas', productoController.getMarcas.bind(productoController));
router.get('/unidades-medida', productoController.getUnidadesMedida.bind(productoController));
router.get('/:id/relacionados', productoController.getRelacionados.bind(productoController));
router.get('/:id/imagenes', productoController.getImagenes.bind(productoController));
router.get('/:id', productoController.getProductoById.bind(productoController));
// Rutas protegidas
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('productos', 'crear'), productoController.createProducto.bind(productoController));
router.put('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('productos', 'editar'), productoController.updateProducto.bind(productoController));
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('productos', 'eliminar'), productoController.deleteProducto.bind(productoController));
// Rutas para imágenes (requieren autenticación)
router.post('/:id/imagenes', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('productos', 'editar'), producto_controller_1.upload.array('imagenes', 10), productoController.subirImagenes.bind(productoController));
router.put('/imagenes/:imagenId/principal', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('productos', 'editar'), productoController.setImagenPrincipal.bind(productoController));
router.get('/:id/imagenes', productoController.getImagenes.bind(productoController));
router.delete('/imagenes/:imagenId', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('productos', 'editar'), productoController.eliminarImagen.bind(productoController));
exports.default = router;
