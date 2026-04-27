import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';
import { CuponService } from '../services/cupon.service';

const prisma = new PrismaClient();
const cuponService = new CuponService();

const validarCuponSchema = z.object({
  codigo: z.string().min(1),
  subtotal: z.number().min(0),
});

const crudCuponSchema = z.object({
  codigo: z.string().min(3).optional(),
  tipo: z.enum(['porcentaje', 'fijo']).optional(),
  valor: z.number().min(0).optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  monto_minimo: z.number().min(0).nullable().optional(),
  usos_maximos: z.number().int().min(1).nullable().optional(),
  activo: z.boolean().optional(),
});

export class CuponController {
  async validarCupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { codigo, subtotal } = validarCuponSchema.parse(req.body);
      
      const cupon = await prisma.ord_cupones.findFirst({
        where: {
          codigo: codigo.toUpperCase(),
          activo: true,
          fecha_inicio: { lte: new Date() },
          fecha_fin: { gte: new Date() },
        },
      });
      
      if (!cupon) {
        throw new AppError('Cupón inválido o expirado', 400);
      }
      
      let descuento = 0;
      if (cupon.tipo === 'porcentaje') {
        descuento = subtotal * (Number(cupon.valor) / 100);
      } else {
        descuento = Number(cupon.valor);
      }
      
      if (descuento > subtotal) {
        descuento = subtotal;
      }
      
      res.json({
        success: true,
        data: {
          codigo: cupon.codigo,
          descuento,
          tipo: cupon.tipo,
          valor: Number(cupon.valor),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCuponesAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const data = await cuponService.getCupones(page, limit);
      res.json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  async crearCupon(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = crudCuponSchema.parse(req.body);
      if (!payload.codigo || !payload.tipo || !payload.valor || !payload.fecha_inicio || !payload.fecha_fin) {
        throw new AppError('Faltan campos requeridos para crear cupón', 400);
      }
      const data = await cuponService.crearCupon(payload);
      res.status(201).json({ success: true, data, message: 'Cupón creado' });
    } catch (error) {
      next(error);
    }
  }

  async actualizarCupon(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const payload = crudCuponSchema.parse(req.body);
      const data = await cuponService.actualizarCupon(id, payload);
      res.json({ success: true, data, message: 'Cupón actualizado' });
    } catch (error) {
      next(error);
    }
  }

  async eliminarCupon(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await cuponService.eliminarCupon(id);
      res.json({ success: true, message: 'Cupón eliminado' });
    } catch (error) {
      next(error);
    }
  }
}