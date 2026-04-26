import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WishlistController {
  // Obtener lista de deseos del usuario
  async getWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      const wishlist = await prisma.cli_lista_deseos.findFirst({
        where: { cliente_id: cliente.id },
        include: {
          items: {
            include: {
              producto: {
                include: {
                  imagenes: {
                    where: { es_principal: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
      
      res.json({ success: true, data: wishlist });
    } catch (error) {
      next(error);
    }
  }
  
  // Agregar producto a lista de deseos
  async addToWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const { productoId } = req.body;
      
      if (!productoId) {
        throw new AppError('Producto ID requerido', 400);
      }
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      let wishlist = await prisma.cli_lista_deseos.findFirst({
        where: { cliente_id: cliente.id },
      });
      
      if (!wishlist) {
        wishlist = await prisma.cli_lista_deseos.create({
          data: {
            cliente_id: cliente.id,
            nombre_lista: 'Mi lista',
          },
        });
      }
      
      // Verificar si ya existe
      const existe = await prisma.cli_items_lista_deseos.findFirst({
        where: {
          lista_id: wishlist.id,
          producto_id: productoId,
        },
      });
      
      if (existe) {
        throw new AppError('Producto ya está en tu lista de deseos', 409);
      }
      
      await prisma.cli_items_lista_deseos.create({
        data: {
          lista_id: wishlist.id,
          producto_id: productoId,
        },
      });
      
      res.json({ success: true, message: 'Producto agregado a tu lista de deseos' });
    } catch (error) {
      next(error);
    }
  }
  
  // Eliminar producto de lista de deseos
  async removeFromWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const { productoId } = req.params;
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      const wishlist = await prisma.cli_lista_deseos.findFirst({
        where: { cliente_id: cliente.id },
      });
      
      if (!wishlist) {
        throw new AppError('Lista de deseos no encontrada', 404);
      }
      
      await prisma.cli_items_lista_deseos.deleteMany({
        where: {
          lista_id: wishlist.id,
          producto_id: parseInt(productoId),
        },
      });
      
      res.json({ success: true, message: 'Producto eliminado de tu lista de deseos' });
    } catch (error) {
      next(error);
    }
  }
}