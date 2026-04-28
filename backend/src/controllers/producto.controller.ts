import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { ProductoService } from '../services/producto.service';
import { productoSchema, productoUpdateSchema, productoFilterSchema } from '../schemas/producto.schema';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import multer from 'multer';
import path from 'path';
import { io } from '../index';
import fs from 'fs';
import { uploadCloudinary } from '../config/cloudinary';
import { config } from '../config';

const prisma = new PrismaClient();
const productoService = new ProductoService();

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export class ProductoController {

  private fixImageUrl(url: string): string {
    if (!url) return url;
    // Si la URL es de localhost, reemplazar con la URL de producción
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      const baseUrl = process.env.BACKEND_URL || 'https://carrito-compras-react-f7qf.onrender.com';
      // Extraer solo la parte después de /uploads/
      const path = url.split('/uploads/')[1];
      return `${baseUrl}/uploads/${path}`;
    }
    return url;
  }

  async getProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = productoFilterSchema.parse(req.query);
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
    } catch (error) {
      next(error);
    }
  }

  
  async getProductoById(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.id);
      
      const producto = await prisma.cat_productos.findUnique({
        where: { id: productoId },
        include: { imagenes: true }
      });
      
      if (!producto) {
        throw new AppError('Producto no encontrado', 404);
      }
      
      // Transformar URLs de imágenes
      if (producto.imagenes) {
        producto.imagenes = producto.imagenes.map(img => ({
          ...img,
          url: this.fixImageUrl(img.url)
        }));
      }
      
      res.json({
        success: true,
        data: producto
      });
    } catch (error) {
      next(error);
    }
  }
  
  async createProducto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = productoSchema.parse(req.body);
      const producto = await productoService.createProducto(data, req.user!.id);
      res.status(201).json({
        success: true,
        data: producto,
        message: 'Producto creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateProducto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = productoUpdateSchema.parse(req.body);
      
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
      
      const producto = await productoService.updateProducto(id, data, req.user!.id);
      
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
        io.to(`producto_${id}`).emit('precio-actualizado', {
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
    } catch (error) {
      next(error);
    }
  }
  
  async deleteProducto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await productoService.deleteProducto(id, req.user!.id);
      res.json({
        success: true,
        message: 'Producto eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getDestacados(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
      const productos = await productoService.getProductosDestacados(limit);
      res.json({
        success: true,
        data: productos,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getOfertas(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
      const productos = await productoService.getProductosOfertas(limit);
      res.json({
        success: true,
        data: productos,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getNuevos(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
      const productos = await productoService.getProductosNuevos(limit);
      res.json({
        success: true,
        data: productos,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getRelacionados(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const productos = await productoService.getProductosRelacionados(id, limit);
      res.json({
        success: true,
        data: productos,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategorias(_req: Request, res: Response, next: NextFunction) {
    try {
      const categorias = await productoService.getCategorias();
      res.json({ success: true, data: categorias });
    } catch (error) {
      next(error);
    }
  }

  async getSubcategorias(_req: Request, res: Response, next: NextFunction) {
    try {
      const subcategorias = await productoService.getSubcategorias();
      res.json({ success: true, data: subcategorias });
    } catch (error) {
      next(error);
    }
  }

  async getMarcas(_req: Request, res: Response, next: NextFunction) {
    try {
      const marcas = await productoService.getMarcas();
      res.json({ success: true, data: marcas });
    } catch (error) {
      next(error);
    }
  }

  async getUnidadesMedida(_req: Request, res: Response, next: NextFunction) {
    try {
      const unidades = await productoService.getUnidadesMedida();
      res.json({ success: true, data: unidades });
    } catch (error) {
      next(error);
    }
  }

  // Subir imágenes de producto
  async subirImagenes(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.id);
      
      const producto = await prisma.cat_productos.findUnique({
        where: { id: productoId },
      });
      
      if (!producto) {
        throw new AppError('Producto no encontrado', 404);
      }
      
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new AppError('No se subieron imágenes', 400);
      }
      
      const imagenesExistentes = await prisma.cat_imagenes_producto.count({
        where: { producto_id: productoId },
      });
      
      // 🔥 CORREGIDO: Usar la URL pública de Render
      // En lugar de 'http://localhost:3000', usar la variable de entorno
      const baseUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'https://carrito-compras-react-f7qf.onrender.com';
      
      const imagenes = [];
      for (let i = 0; i < files.length; i++) {
        const imagen = await prisma.cat_imagenes_producto.create({
          data: {
            producto_id: productoId,
            url: `${baseUrl}/uploads/${files[i].filename}`, // ✅ URL CORRECTA
            orden: imagenesExistentes + i,
            es_principal: imagenesExistentes === 0 && i === 0,
          },
        });
        imagenes.push(imagen);
      }
      
      res.json({ success: true, data: imagenes });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener imágenes de un producto
  async getImagenes(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.id);
      
      const imagenes = await prisma.cat_imagenes_producto.findMany({
        where: { producto_id: productoId },
        orderBy: { orden: 'asc' },
      });
      
      res.json({ success: true, data: imagenes });
    } catch (error) {
      next(error);
    }
  }
  
  // Eliminar imagen
  async eliminarImagen(req: Request, res: Response, next: NextFunction) {
    try {
      const imagenId = parseInt(req.params.imagenId);
      
      await prisma.cat_imagenes_producto.delete({
        where: { id: imagenId },
      });
      
      res.json({ success: true, message: 'Imagen eliminada' });
    } catch (error) {
      next(error);
    }
  }
  
  // Marcar imagen como principal
  async setImagenPrincipal(req: Request, res: Response, next: NextFunction) {
  try {
    const imagenId = parseInt(req.params.imagenId);
    
    // Obtener la imagen para saber el producto
    const imagen = await prisma.cat_imagenes_producto.findUnique({
      where: { id: imagenId },
    });
    
    if (!imagen) {
      throw new AppError('Imagen no encontrada', 404);
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
  } catch (error) {
    next(error);
  }
}

  async getTodosProductos(_req: Request, res: Response, next: NextFunction) {
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
        
        const precioActual = tieneOferta ? precioOferta! : precioVenta;
        const descuentoPorcentaje = tieneOferta && precioVenta > 0
          ? Math.round(((precioVenta - precioOferta!) / precioVenta) * 100)
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
        };
      });
      
      res.json({ success: true, data: productosFormateados });
    } catch (error) {
      next(error);
    }
  }
}

// Exportar el middleware upload para usarlo en las rutas
export { upload };