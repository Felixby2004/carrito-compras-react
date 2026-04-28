import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';

const prisma = new PrismaClient();

export class ClienteController {
  
  // Obtener todos los clientes (admin)
  async getClientesAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { segmento, search, page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = {};
      
      if (segmento) where.segmento = segmento as string;
      
      if (search) {
        where.OR = [
          { usuario: { email: { contains: search as string, mode: 'insensitive' } } },
          { telefono: { contains: search as string } },
        ];
      }
      
      const [clientes, total] = await Promise.all([
        prisma.cli_clientes.findMany({
          where,
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
                activo: true,
                created_at: true,
              },
            },
            ordenes: {
              take: 5,
              orderBy: { created_at: 'desc' },
              select: {
                id: true,
                orden_numero: true,
                total: true,
                created_at: true,
                estado: true,
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { created_at: 'desc' },
        }),
        prisma.cli_clientes.count({ where }),
      ]);

      const clientesIds = clientes.map((cliente) => cliente.id);
      const ordenesPorCliente = clientesIds.length > 0
        ? await prisma.ord_ordenes.groupBy({
            by: ['cliente_id'],
            where: {
              cliente_id: { in: clientesIds },
              estado: { notIn: ['cancelada', 'cancelado', 'devuelta', 'devuelto', 'pendiente_pago'] },
            },
            _sum: { total: true },
            _max: { created_at: true },
          })
        : [];

      const resumenPorCliente = new Map(
        ordenesPorCliente.map((registro) => [
          registro.cliente_id,
          {
            total: Number(registro._sum?.total ?? 0), // 👈 Usar ?. y ??
            ultimaCompra: registro._max?.created_at ?? null, // 👈 Usar ?. y ??
          },
        ]),
      );
      
      // Calcular segmentación si no viene filtrada
      const clientesConSegmento = clientes.map(cliente => {
        const resumenCliente = resumenPorCliente.get(cliente.id);
        const totalGastadoReal = resumenCliente?.total ?? 0;
        let segmentoCalculado = cliente.segmento;
        
        // Si no tiene segmento definido, calcularlo
        if (!cliente.segmento || cliente.segmento === 'nuevo') {
          const totalGastado = Number(totalGastadoReal);
          const fechaUltimaCompra = resumenCliente?.ultimaCompra || cliente.fecha_ultima_compra;
          const diasDesdeUltimaCompra = fechaUltimaCompra 
            ? Math.floor((Date.now() - new Date(fechaUltimaCompra).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          if (totalGastado > 5000) {
            segmentoCalculado = 'vip';
          } else if (cliente.ordenes.length > 1 && diasDesdeUltimaCompra < 90) {
            segmentoCalculado = 'recurrente';
          } else if (diasDesdeUltimaCompra > 180) {
            segmentoCalculado = 'inactivo';
          } else {
            segmentoCalculado = 'nuevo';
          }
        }
        
        return {
          ...cliente,
          segmento: segmentoCalculado,
          total_gastado: Number(totalGastadoReal),
          fecha_ultima_compra: resumenCliente?.ultimaCompra ?? cliente.fecha_ultima_compra ?? null,
          ordenes: cliente.ordenes.map((orden: any) => ({
            ...orden,
            total: Number(orden.total),
          })),
        };
      });
      
      res.json({
        success: true,
        data: clientesConSegmento,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener detalle de un cliente
  async getClienteById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { id },
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              activo: true,
              created_at: true,
            },
          },
          direcciones: true,
          ordenes: {
            include: {
              items: true,
              direccion_envio: true,
            },
            orderBy: { created_at: 'desc' },
          },
          lista_deseos: {
            include: {
              items: {
                include: {
                  producto: true,
                },
              },
            },
          },
          resenas: {
            include: {
              producto: true,
            },
          },
        },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      // Convertir Decimal a número en cliente y órdenes
      const clienteConvertido = {
        ...cliente,
        total_gastado: Number(cliente.total_gastado),
        ordenes: cliente.ordenes.map((orden: any) => ({
          ...orden,
          subtotal: Number(orden.subtotal),
          impuesto: Number(orden.impuesto),
          descuento: Number(orden.descuento),
          costo_envio: Number(orden.costo_envio),
          total: Number(orden.total),
          items: orden.items.map((item: any) => ({
            ...item,
            precio_unitario: Number(item.precio_unitario),
            subtotal: Number(item.subtotal),
          })),
        })),
      };
      
      res.json({
        success: true,
        data: clienteConvertido,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Cambiar estado del cliente (activar/desactivar)
  async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { activo } = req.body;
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { id },
        include: { usuario: true },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      await prisma.seg_usuarios.update({
        where: { id: cliente.usuario_id },
        data: { activo },
      });
      
      res.json({
        success: true,
        message: activo ? 'Cliente activado' : 'Cliente desactivado',
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener estadísticas de clientes
  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const [total, nuevos, recurrentes, vip, inactivos] = await Promise.all([
        prisma.cli_clientes.count(),
        prisma.cli_clientes.count({ where: { segmento: 'nuevo' } }),
        prisma.cli_clientes.count({ where: { segmento: 'recurrente' } }),
        prisma.cli_clientes.count({ where: { segmento: 'vip' } }),
        prisma.cli_clientes.count({ where: { segmento: 'inactivo' } }),
      ]);
      
      res.json({
        success: true,
        data: {
          total,
          nuevos,
          recurrentes,
          vip,
          inactivos,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener direcciones del cliente autenticado
    async getMisDirecciones(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
        throw new AppError('No autenticado', 401);
        }
        
        const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
        include: { direcciones: true },
        });
        
        if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
        }
        
        res.json({ success: true, data: cliente.direcciones });
    } catch (error) {
        next(error);
    }
    }

    // Crear nueva dirección
    async crearDireccion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
        throw new AppError('No autenticado', 401);
        }
        
        const { alias, direccion_completa, ciudad, departamento, codigo_postal, telefono, es_principal } = req.body;
        
        const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
        });
        
        if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
        }
        
        const direccion = await prisma.cli_direcciones.create({
        data: {
            cliente_id: cliente.id,
            alias,
            direccion_completa,
            ciudad,
            departamento,
            codigo_postal,
            telefono,
            es_principal: es_principal || false,
        },
        });
        
        res.status(201).json({ success: true, data: direccion });
    } catch (error) {
        next(error);
    }
    }
}