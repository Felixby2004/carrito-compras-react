import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';

const prisma = new PrismaClient();

const crearProveedorSchema = z.object({
  razon_social: z.string().min(3, 'Razón social debe tener al menos 3 caracteres'),
  ruc: z.string().regex(/^\d+$/, 'RUC debe contener solo números').min(11, 'RUC debe tener al menos 11 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
});

const actualizarProveedorSchema = crearProveedorSchema.partial();

export class ProveedorController {
  
  // Crear proveedor
  async crearProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const datos = crearProveedorSchema.parse(req.body);
      
      // Verificar que el RUC no existe
      const proveedorExistente = await prisma.inv_proveedores.findUnique({
        where: { ruc: datos.ruc },
      });
      
      if (proveedorExistente) {
        throw new AppError('El RUC ya está registrado', 409);
      }
      
      const proveedor = await prisma.inv_proveedores.create({
        data: {
          razon_social: datos.razon_social,
          ruc: datos.ruc,
          email: datos.email || null,
          telefono: datos.telefono || null,
          direccion: datos.direccion || null,
          activo: true,
        },
      });
      
      res.status(201).json({
        success: true,
        message: 'Proveedor creado exitosamente',
        data: proveedor,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener todos los proveedores
  async obtenerProveedores(req: Request, res: Response, next: NextFunction) {
    try {
      const { activos = true, buscar = '', pagina = 1, limite = 20 } = req.query;
      
      const skip = (Number(pagina) - 1) * Number(limite);
      
      const where: any = {};
      
      if (activos === 'true' || activos === '1') {
        where.activo = true;
      }
      
      if (buscar) {
        where.OR = [
          { razon_social: { contains: buscar as string, mode: 'insensitive' } },
          { ruc: { contains: buscar as string, mode: 'insensitive' } },
          { email: { contains: buscar as string, mode: 'insensitive' } },
        ];
      }
      
      const [proveedores, total] = await Promise.all([
        prisma.inv_proveedores.findMany({
          where,
          skip,
          take: Number(limite),
          orderBy: { razon_social: 'asc' },
        }),
        prisma.inv_proveedores.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: proveedores,
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        totalPaginas: Math.ceil(total / Number(limite)),
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener proveedor por ID
  async obtenerProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      
      const proveedor = await prisma.inv_proveedores.findUnique({
        where: { id },
        include: {
          ordenes_compra: {
            take: 10,
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              numero_oc: true,
              estado: true,
              total: true,
              created_at: true,
            },
          },
        },
      });
      
      if (!proveedor) {
        throw new AppError('Proveedor no encontrado', 404);
      }
      
      res.json({
        success: true,
        data: proveedor,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Actualizar proveedor
  async actualizarProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const datos = actualizarProveedorSchema.parse(req.body);
      
      const proveedor = await prisma.inv_proveedores.findUnique({
        where: { id },
      });
      
      if (!proveedor) {
        throw new AppError('Proveedor no encontrado', 404);
      }
      
      // Si cambia el RUC, verificar que no exista
      if (datos.ruc && datos.ruc !== proveedor.ruc) {
        const rucExistente = await prisma.inv_proveedores.findUnique({
          where: { ruc: datos.ruc },
        });
        if (rucExistente) {
          throw new AppError('El RUC ya está registrado', 409);
        }
      }
      
      const actualizado = await prisma.inv_proveedores.update({
        where: { id },
        data: {
          razon_social: datos.razon_social || undefined,
          ruc: datos.ruc || undefined,
          email: datos.email || undefined,
          telefono: datos.telefono || undefined,
          direccion: datos.direccion || undefined,
        },
      });
      
      res.json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: actualizado,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Eliminar/Desactivar proveedor
  async eliminarProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      
      const proveedor = await prisma.inv_proveedores.findUnique({
        where: { id },
        include: {
          ordenes_compra: { take: 1 },
        },
      });
      
      if (!proveedor) {
        throw new AppError('Proveedor no encontrado', 404);
      }
      
      // Si tiene órdenes de compra, solo desactivar
      if (proveedor.ordenes_compra.length > 0) {
        const actualizado = await prisma.inv_proveedores.update({
          where: { id },
          data: { activo: false },
        });
        
        return res.json({
          success: true,
          message: 'Proveedor desactivado (tiene órdenes de compra)',
          data: actualizado,
        });
      }
      
      // Si no tiene órdenes, eliminar completamente
      await prisma.inv_proveedores.delete({
        where: { id },
      });
      
      res.json({
        success: true,
        message: 'Proveedor eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}
