import { Response, NextFunction } from 'express';
import { CarritoService } from '../services/carrito.service';
import { addToCartSchema, updateCartItemSchema } from '../schemas/carrito.schema';
import { AuthRequest } from '../middlewares/auth.middleware';

const carritoService = new CarritoService();

export class CarritoController {
  
  private getSessionId(req: AuthRequest): string {
    // Intentar obtener del header X-Session-Id
    let sessionId = req.headers['x-session-id'] as string;
    console.log('getSessionId - header:', sessionId);
    
    // Si no hay sessionId en header, generar uno nuevo
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
      console.log('getSessionId - generado nuevo:', sessionId);
    }
    
    return sessionId;
  }
  
  async getCarrito(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user?.id || null;
      const sessionId = !usuarioId ? this.getSessionId(req) : null;
      
      const carrito = await carritoService.getCarrito(usuarioId, sessionId);
      
      res.json({
        success: true,
        data: carrito,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async addToCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user?.id || null;
      const sessionId = !usuarioId ? this.getSessionId(req) : null;
      const data = addToCartSchema.parse(req.body);
      
      const carrito = await carritoService.addToCart(usuarioId, sessionId, data);
      
      res.json({
        success: true,
        data: carrito,
        message: 'Producto agregado al carrito',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateCartItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user?.id || null;
      const sessionId = !usuarioId ? this.getSessionId(req) : null;
      const itemId = parseInt(req.params.itemId);
      const { cantidad } = updateCartItemSchema.parse(req.body);
      
      const carrito = await carritoService.updateCartItem(usuarioId, sessionId, itemId, cantidad);
      
      res.json({
        success: true,
        data: carrito,
        message: cantidad === 0 ? 'Item eliminado del carrito' : 'Carrito actualizado',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async removeCartItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user?.id || null;
      const sessionId = !usuarioId ? this.getSessionId(req) : null;
      const itemId = parseInt(req.params.itemId);
      
      const carrito = await carritoService.removeCartItem(usuarioId, sessionId, itemId);
      
      res.json({
        success: true,
        data: carrito,
        message: 'Item eliminado del carrito',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async clearCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user?.id || null;
      const sessionId = !usuarioId ? this.getSessionId(req) : null;
      
      const carrito = await carritoService.clearCart(usuarioId, sessionId);
      
      res.json({
        success: true,
        data: carrito,
        message: 'Carrito vaciado',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async mergeCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        res.json({ success: true, data: null });
        return;
      }
      
      const carrito = await carritoService.mergeCart(req.user!.id, sessionId);
      
      res.json({
        success: true,
        data: carrito,
        message: 'Carrito sincronizado',
      });
    } catch (error) {
      next(error);
    }
  }
}