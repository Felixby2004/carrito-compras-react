import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ResenaController {
  // Obtener reseñas de un producto
  async getResenasByProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.productoId);
      
      const resenas = await prisma.cli_resenas_producto.findMany({
        where: { producto_id: productoId },
        include: {
          cliente: {
            include: {
              usuario: true,
            },
          },
        },
        orderBy: { fecha_resena: 'desc' },
      });
      
      // Calcular promedio
      const promedio = resenas.length > 0
        ? resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length
        : 0;
      
      res.json({
        success: true,
        data: resenas,
        promedio,
        total: resenas.length,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Crear una reseña
  async createResena(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const { productoId, calificacion, comentario } = req.body;
      
      if (!productoId || !calificacion) {
        throw new AppError('Producto ID y calificación son requeridos', 400);
      }
      
      if (calificacion < 1 || calificacion > 5) {
        throw new AppError('Calificación debe ser entre 1 y 5', 400);
      }
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      // Verificar si ya reseñó este producto
      const existe = await prisma.cli_resenas_producto.findFirst({
        where: {
          cliente_id: cliente.id,
          producto_id: productoId,
        },
      });
      
      if (existe) {
        throw new AppError('Ya has reseñado este producto', 409);
      }
      
      const resena = await prisma.cli_resenas_producto.create({
        data: {
          cliente_id: cliente.id,
          producto_id: productoId,
          calificacion,
          comentario,
        },
      });
      
      res.json({ success: true, data: resena, message: 'Reseña agregada exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}