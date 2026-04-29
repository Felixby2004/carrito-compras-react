"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.ProductoController = void 0;
const client_1 = require("@prisma/client");
const producto_service_1 = require("../services/producto.service");
const producto_schema_1 = require("../schemas/producto.schema");
const errorHandler_1 = require("../middlewares/errorHandler");
const config_1 = __importDefault(require("../config"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const index_1 = require("../index");
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
const productoService = new producto_service_1.ProductoService();
// Configurar multer para subir imágenes
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
exports.upload = upload;
class ProductoController {
    fixImageUrl(url) {
        if (!url)
            return url;
        // Si la URL ya es absoluta y no es localhost, dejarla como está
        if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
            return url;
        }
        // Si es localhost o una ruta relativa, usar la backendUrl configurada
        const baseUrl = config_1.default.backendUrl;
        if (url.includes('/uploads/')) {
            const path = url.split('/uploads/')[1];
            return `${baseUrl}/uploads/${path}`;
        }
        return url;
    }
    async getProductos(req, res, next) {
        try {
            const filters = producto_schema_1.productoFilterSchema.parse(req.query);
            const result = await productoService.getProductos(filters);
            // Transformar URLs de imágenes en los productos
            const productosConImagenesCorregidas = result.data.map(producto => ({
                ...producto,
                imagenes: producto.imagenes?.map(img => ({
                    ...img,
                    url: this.fixImageUrl(img.url)
                })) || []
            }));
            res.json({
                success: true,
                data: productosConImagenesCorregidas,
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getProductoById(req, res, next) {
        try {
            const productoId = parseInt(req.params.id);
            const producto = await prisma.cat_productos.findUnique({
                where: { id: productoId },
                include: {
                    imagenes: true,
                    stock: true // 👈 Asegurar que incluye stock
                }
            });
            if (!producto) {
                throw new errorHandler_1.AppError('Producto no encontrado', 404);
            }
            // Calcular stock disponible
            const ahora = new Date();
            const precioVenta = Number(producto.precio_venta);
            const precioOferta = producto.precio_oferta ? Number(producto.precio_oferta) : null;
            const tieneOferta = precioOferta !== null &&
                producto.fecha_inicio_oferta &&
                producto.fecha_fin_oferta &&
                new Date(producto.fecha_inicio_oferta) <= ahora &&
                new Date(producto.fecha_fin_oferta) >= ahora;
            const precioActual = tieneOferta ? precioOferta : precioVenta;
            const descuentoPorcentaje = tieneOferta && precioVenta > 0
                ? Math.round(((precioVenta - precioOferta) / precioVenta) * 100)
                : 0;
            // 👈 Calcular stock disponible correctamente
            const stockDisponible = producto.stock
                ? Number(producto.stock.stock_fisico) - (Number(producto.stock.stock_reservado) || 0)
                : 0;
            // Transformar URLs de imágenes
            const imagenesCorregidas = producto.imagenes?.map(img => ({
                ...img,
                url: this.fixImageUrl(img.url)
            })) || [];
            const productoFormateado = {
                ...producto,
                precio_venta: precioVenta,
                precio_oferta: precioOferta,
                precio_actual: precioActual,
                descuento_porcentaje: descuentoPorcentaje,
                stock_disponible: stockDisponible,
                imagenes: imagenesCorregidas
            };
            res.json({
                success: true,
                data: productoFormateado
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createProducto(req, res, next) {
        try {
            const data = producto_schema_1.productoSchema.parse(req.body);
            const producto = await productoService.createProducto(data, req.user.id);
            res.status(201).json({
                success: true,
                data: producto,
                message: 'Producto creado exitosamente',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProducto(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const data = producto_schema_1.productoUpdateSchema.parse(req.body);
            // Obtener precio anterior - usar consulta directa más simple
            const productoAnterior = await prisma.cat_productos.findUnique({
                where: { id },
                select: { precio_venta: true, precio_oferta: true, fecha_inicio_oferta: true, fecha_fin_oferta: true, nombre: true },
            });
            // Calcular precio actual anterior
            const ahora = new Date();
            let precioActualAnterior = Number(productoAnterior?.precio_venta || 0);
            if (productoAnterior?.precio_oferta &&
                productoAnterior.fecha_inicio_oferta &&
                productoAnterior.fecha_fin_oferta &&
                new Date(productoAnterior.fecha_inicio_oferta) <= ahora &&
                new Date(productoAnterior.fecha_fin_oferta) >= ahora) {
                precioActualAnterior = Number(productoAnterior.precio_oferta);
            }
            const producto = await productoService.updateProducto(id, data, req.user.id);
            // Obtener precio actual actualizado
            let precioActualNuevo = Number(producto.precio_venta);
            if (producto.precio_oferta &&
                producto.fecha_inicio_oferta &&
                producto.fecha_fin_oferta &&
                new Date(producto.fecha_inicio_oferta) <= ahora &&
                new Date(producto.fecha_fin_oferta) >= ahora) {
                precioActualNuevo = Number(producto.precio_oferta);
            }
            // Si el precio cambió, notificar a los clientes suscritos
            if (precioActualAnterior !== precioActualNuevo) {
                index_1.io.to(`producto_${id}`).emit('precio-actualizado', {
                    productoId: id,
                    precioAnterior: precioActualAnterior,
                    precioNuevo: precioActualNuevo,
                    nombre: productoAnterior?.nombre || producto.nombre,
                });
            }
            res.json({
                success: true,
                data: producto,
                message: 'Producto actualizado exitosamente',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteProducto(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            await productoService.deleteProducto(id, req.user.id);
            res.json({
                success: true,
                message: 'Producto eliminado exitosamente',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getDestacados(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 8;
            const productos = await productoService.getProductosDestacados(limit);
            // Transformar URLs de imágenes
            const productosConImagenesCorregidas = productos.map(producto => ({
                ...producto,
                imagenes: producto.imagenes?.map(img => ({
                    ...img,
                    url: this.fixImageUrl(img.url)
                })) || []
            }));
            res.json({
                success: true,
                data: productosConImagenesCorregidas,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getOfertas(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 8;
            const productos = await productoService.getProductosOfertas(limit);
            // Transformar URLs de imágenes
            const productosConImagenesCorregidas = productos.map(producto => ({
                ...producto,
                imagenes: producto.imagenes?.map(img => ({
                    ...img,
                    url: this.fixImageUrl(img.url)
                })) || []
            }));
            res.json({
                success: true,
                data: productosConImagenesCorregidas,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getNuevos(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 8;
            const productos = await productoService.getProductosNuevos(limit);
            // Transformar URLs de imágenes
            const productosConImagenesCorregidas = productos.map(producto => ({
                ...producto,
                imagenes: producto.imagenes?.map(img => ({
                    ...img,
                    url: this.fixImageUrl(img.url)
                })) || []
            }));
            res.json({
                success: true,
                data: productosConImagenesCorregidas,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getRelacionados(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const limit = req.query.limit ? parseInt(req.query.limit) : 4;
            const productos = await productoService.getProductosRelacionados(id, limit);
            // Transformar URLs de imágenes
            const productosConImagenesCorregidas = productos.map(producto => ({
                ...producto,
                imagenes: producto.imagenes?.map(img => ({
                    ...img,
                    url: this.fixImageUrl(img.url)
                })) || []
            }));
            res.json({
                success: true,
                data: productosConImagenesCorregidas,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCategorias(_req, res, next) {
        try {
            const categorias = await productoService.getCategorias();
            res.json({ success: true, data: categorias });
        }
        catch (error) {
            next(error);
        }
    }
    async getSubcategorias(_req, res, next) {
        try {
            const subcategorias = await productoService.getSubcategorias();
            res.json({ success: true, data: subcategorias });
        }
        catch (error) {
            next(error);
        }
    }
    async getMarcas(_req, res, next) {
        try {
            const marcas = await productoService.getMarcas();
            res.json({ success: true, data: marcas });
        }
        catch (error) {
            next(error);
        }
    }
    async getUnidadesMedida(_req, res, next) {
        try {
            const unidades = await productoService.getUnidadesMedida();
            res.json({ success: true, data: unidades });
        }
        catch (error) {
            next(error);
        }
    }
    // Subir imágenes de producto
    async subirImagenes(req, res, next) {
        try {
            const productoId = parseInt(req.params.id);
            const producto = await prisma.cat_productos.findUnique({
                where: { id: productoId },
            });
            if (!producto) {
                throw new errorHandler_1.AppError('Producto no encontrado', 404);
            }
            const files = req.files;
            if (!files || files.length === 0) {
                throw new errorHandler_1.AppError('No se subieron imágenes', 400);
            }
            const imagenesExistentes = await prisma.cat_imagenes_producto.count({
                where: { producto_id: productoId },
            });
            // Usar la URL base configurada
            const baseUrl = config_1.default.backendUrl;
            const imagenes = [];
            const multerFiles = files; // Fallback para evitar errores de tipo si Express.Multer no está global
            for (let i = 0; i < multerFiles.length; i++) {
                const imagen = await prisma.cat_imagenes_producto.create({
                    data: {
                        producto_id: productoId,
                        url: `${baseUrl}/uploads/${multerFiles[i].filename}`,
                        orden: imagenesExistentes + i,
                        es_principal: imagenesExistentes === 0 && i === 0,
                    },
                });
                imagenes.push(imagen);
            }
            res.json({ success: true, data: imagenes });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtener imágenes de un producto
    async getImagenes(req, res, next) {
        try {
            const productoId = parseInt(req.params.id);
            const imagenes = await prisma.cat_imagenes_producto.findMany({
                where: { producto_id: productoId },
                orderBy: { orden: 'asc' },
            });
            // Transformar URLs
            const imagenesCorregidas = imagenes.map(img => ({
                ...img,
                url: this.fixImageUrl(img.url)
            }));
            res.json({ success: true, data: imagenesCorregidas });
        }
        catch (error) {
            next(error);
        }
    }
    // Eliminar imagen
    async eliminarImagen(req, res, next) {
        try {
            const imagenId = parseInt(req.params.imagenId);
            await prisma.cat_imagenes_producto.delete({
                where: { id: imagenId },
            });
            res.json({ success: true, message: 'Imagen eliminada' });
        }
        catch (error) {
            next(error);
        }
    }
    // Marcar imagen como principal
    async setImagenPrincipal(req, res, next) {
        try {
            const imagenId = parseInt(req.params.imagenId);
            // Obtener la imagen para saber el producto
            const imagen = await prisma.cat_imagenes_producto.findUnique({
                where: { id: imagenId },
            });
            if (!imagen) {
                throw new errorHandler_1.AppError('Imagen no encontrada', 404);
            }
            // Quitar principal de todas las imágenes del producto
            await prisma.cat_imagenes_producto.updateMany({
                where: { producto_id: imagen.producto_id },
                data: { es_principal: false },
            });
            // Marcar esta como principal
            await prisma.cat_imagenes_producto.update({
                where: { id: imagenId },
                data: { es_principal: true },
            });
            res.json({ success: true, message: 'Imagen principal actualizada' });
        }
        catch (error) {
            next(error);
        }
    }
    async getTodosProductos(_req, res, next) {
        try {
            // Consulta directa a Prisma
            const productos = await prisma.cat_productos.findMany({
                where: {},
                include: {
                    categoria: true,
                    subcategoria: true,
                    marca: true,
                    imagenes: {
                        where: { es_principal: true },
                        take: 1,
                    },
                    stock: true,
                },
                orderBy: { created_at: 'desc' },
            });
            const ahora = new Date();
            const productosFormateados = productos.map(p => {
                const precioVenta = Number(p.precio_venta);
                const precioOferta = p.precio_oferta ? Number(p.precio_oferta) : null;
                const tieneOferta = precioOferta !== null &&
                    p.fecha_inicio_oferta &&
                    p.fecha_fin_oferta &&
                    new Date(p.fecha_inicio_oferta) <= ahora &&
                    new Date(p.fecha_fin_oferta) >= ahora;
                const precioActual = tieneOferta ? precioOferta : precioVenta;
                const descuentoPorcentaje = tieneOferta && precioVenta > 0
                    ? Math.round(((precioVenta - precioOferta) / precioVenta) * 100)
                    : 0;
                return {
                    ...p,
                    precio_venta: precioVenta,
                    precio_costo: p.precio_costo ? Number(p.precio_costo) : 0,
                    precio_oferta: precioOferta,
                    precio_actual: precioActual,
                    descuento_porcentaje: descuentoPorcentaje,
                    stock_disponible: p.stock ? Number(p.stock.stock_fisico) - (Number(p.stock.stock_reservado) || 0) : 0,
                    stock_minimo: p.stock?.stock_minimo || 0,
                    estado: p.estado,
                    imagenes: p.imagenes.map(img => ({
                        ...img,
                        url: this.fixImageUrl(img.url)
                    }))
                };
            });
            res.json({ success: true, data: productosFormateados });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductoController = ProductoController;
