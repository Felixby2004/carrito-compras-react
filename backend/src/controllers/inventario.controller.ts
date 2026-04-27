import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';

const prisma = new PrismaClient();

const ajusteInventarioSchema = z.object({
  cantidad: z.number().int().positive(),
  motivo: z.string().min(5),
});

const crearMovimientoSchema = z.object({
  producto_id: z.number(),
  tipo_movimiento: z.enum(['entrada', 'salida', 'ajuste', 'devolucion']),
  cantidad: z.number().int().positive(),
  motivo: z.string(),
  referencia_id: z.number().optional(),
});

export class InventarioController {
  
  // Obtener stock de todos los productos
  async getStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { pagina = 1, limite = 20, filtro = '' } = req.query;
      const skip = (Number(pagina) - 1) * Number(limite);

      const where: any = {
        producto: {
          activo: true,
        },
      };

      if (filtro) {
        where.producto = {
          OR: [
            { nombre: { contains: filtro, mode: 'insensitive' } },
            { sku: { contains: filtro as string, mode: 'insensitive' } },
          ],
          activo: true,
        };
      }

      const [stocks, total] = await Promise.all([
        prisma.inv_stock_producto.findMany({
          where,
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                sku: true,
                precio_costo: true,
                precio_venta: true,
              },
            },
          },
          skip,
          take: Number(limite),
          orderBy: { updated_at: 'desc' },
        }),
        prisma.inv_stock_producto.count({ where }),
      ]);

      res.json({
        success: true,
        data: stocks.map(s => ({
          ...s,
          stock_disponible: s.stock_fisico - s.stock_reservado,
          valor_inventario: Number(s.producto.precio_costo) * s.stock_fisico,
        })),
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        totalPaginas: Math.ceil(total / Number(limite)),
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener detalles de stock de un producto
  async getStockProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.id);

      const stock = await prisma.inv_stock_producto.findUnique({
        where: { producto_id: productoId },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              sku: true,
              precio_costo: true,
              precio_venta: true,
              categoria: {
                select: {
                  nombre: true,
                },
              },
            },
          },
          movimientos: {
            orderBy: { fecha_movimiento: 'desc' },
            take: 10,
          },
        },
      });

      if (!stock) {
        throw new AppError('Stock no encontrado', 404);
      }

      res.json({
        success: true,
        data: {
          ...stock,
          stock_disponible: stock.stock_fisico - stock.stock_reservado,
          valor_inventario: Number(stock.producto.precio_costo) * stock.stock_fisico,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Ajustar stock de un producto
  async ajustarStock(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.id);
      const datos = ajusteInventarioSchema.parse(req.body);

      const stock = await prisma.inv_stock_producto.findUnique({
        where: { producto_id: productoId },
      });

      if (!stock) {
        throw new AppError('Stock no encontrado', 404);
      }

      const stockAntes = stock.stock_fisico;
      const stockDespues = stockAntes + datos.cantidad;

      // Actualizar stock
      const stockActualizado = await prisma.inv_stock_producto.update({
        where: { producto_id: productoId },
        data: { stock_fisico: stockDespues },
      });

      // Registrar movimiento
      await prisma.inv_movimientos_inventario.create({
        data: {
          producto_id: productoId,
          tipo_movimiento: 'ajuste',
          cantidad: datos.cantidad,
          stock_antes: stockAntes,
          stock_despues: stockDespues,
          motivo: datos.motivo,
          usuario_id: (req as AuthRequest).user?.id,
        },
      });

      res.json({
        success: true,
        message: 'Stock ajustado exitosamente',
        data: stockActualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  // Registrar movimiento de inventario
  async registrarMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const datos = crearMovimientoSchema.parse(req.body);

      const stock = await prisma.inv_stock_producto.findUnique({
        where: { producto_id: datos.producto_id },
      });

      if (!stock) {
        throw new AppError('Stock del producto no encontrado', 404);
      }

      const stockAntes = stock.stock_fisico;
      let stockDespues = stockAntes;

      // Calcular nuevo stock según el tipo de movimiento
      if (datos.tipo_movimiento === 'entrada') {
        stockDespues = stockAntes + datos.cantidad;
      } else if (datos.tipo_movimiento === 'salida') {
        if (stockAntes < datos.cantidad) {
          throw new AppError('Stock insuficiente', 400);
        }
        stockDespues = stockAntes - datos.cantidad;
      } else if (datos.tipo_movimiento === 'devolucion') {
        stockDespues = stockAntes + datos.cantidad;
      }

      // Actualizar stock
      await prisma.inv_stock_producto.update({
        where: { producto_id: datos.producto_id },
        data: { stock_fisico: stockDespues },
      });

      // Registrar movimiento
      const movimiento = await prisma.inv_movimientos_inventario.create({
        data: {
          producto_id: datos.producto_id,
          tipo_movimiento: datos.tipo_movimiento,
          cantidad: datos.cantidad,
          stock_antes: stockAntes,
          stock_despues: stockDespues,
          motivo: datos.motivo,
          referencia_id: datos.referencia_id,
          usuario_id: (req as AuthRequest).user?.id,
        },
      });

      res.json({
        success: true,
        message: 'Movimiento registrado exitosamente',
        data: movimiento,
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener movimientos de inventario
  async getMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const { producto_id, tipo, pagina = 1, limite = 20, desde, hasta } = req.query;

      const where: any = {};

      if (producto_id) where.producto_id = parseInt(producto_id as string);
      if (tipo) where.tipo_movimiento = tipo as string;

      if (desde || hasta) {
        where.fecha_movimiento = {};
        if (desde) where.fecha_movimiento.gte = new Date(desde as string);
        if (hasta) {
          const fechaHasta = new Date(hasta as string);
          fechaHasta.setHours(23, 59, 59, 999);
          where.fecha_movimiento.lte = fechaHasta;
        }
      }

      const skip = (Number(pagina) - 1) * Number(limite);

      const movimientos = await prisma.inv_movimientos_inventario.findMany({
        where,
        include: {
          producto: {
            include: {
              producto: true,
            },
          },
        },
        skip,
        take: Number(limite),
        orderBy: { fecha_movimiento: 'desc' },
      });

      const total = await prisma.inv_movimientos_inventario.count({ where });

      const data = movimientos.map((mov: any) => ({
        ...mov,
        producto: mov.producto?.producto
          ? {
              id: mov.producto.producto.id,
              nombre: mov.producto.producto.nombre,
              sku: mov.producto.producto.sku,
            }
          : null,
      }));

      res.json({
        success: true,
        data,
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        totalPaginas: Math.ceil(total / Number(limite)),
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener productos con bajo stock
  async getProductosBajoStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { limite = 20 } = req.query;

      const productos = await prisma.inv_stock_producto.findMany({
        where: {
          stock_fisico: { lte: 10 },
          producto: { activo: true },
        },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              sku: true,
              precio_costo: true,
              precio_venta: true,
            },
          },
        },
        orderBy: { stock_fisico: 'asc' },
        take: Number(limite),
      });

      res.json({
        success: true,
        data: productos.map(p => ({
          ...p,
          stock_disponible: p.stock_fisico - p.stock_reservado,
          necesita_reorden: p.stock_fisico <= (p.stock_minimo || 10),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear orden de compra (para reabastecimiento)
  async crearOrdenCompra(req: Request, res: Response, next: NextFunction) {
    try {
      const { proveedor_id } = req.body;
      const articulos = Array.isArray(req.body.articulos) ? req.body.articulos : req.body.items;

      if (!Array.isArray(articulos) || articulos.length === 0) {
        throw new AppError('Debe incluir al menos un artículo', 400);
      }

      // Validar que el proveedor existe
      const proveedor = await prisma.inv_proveedores.findUnique({
        where: { id: proveedor_id },
      });

      if (!proveedor) {
        throw new AppError('Proveedor no encontrado', 404);
      }

      // Crear número de OC
      const numeroOc = 'OC-' + Date.now().toString().slice(-8);

      // Calcular total
      let total = 0;
      const detalles = [];

      for (const articulo of articulos) {
        const producto = await prisma.cat_productos.findUnique({
          where: { id: articulo.producto_id },
        });

        if (!producto) {
          throw new AppError(`Producto ${articulo.producto_id} no encontrado`, 404);
        }

        const subtotal = Number(articulo.costo_unitario) * articulo.cantidad;
        total += subtotal;

        detalles.push({
          producto_id: articulo.producto_id,
          cantidad: articulo.cantidad,
          costo_unitario: articulo.costo_unitario,
          subtotal: subtotal,
        });
      }

      // Crear orden de compra
      const ordenCompra = await prisma.inv_ordenes_compra.create({
        data: {
          proveedor_id,
          numero_oc: numeroOc,
          total: total,
          usuario_id: (req as AuthRequest).user?.id,
          detalles: {
            createMany: {
              data: detalles,
            },
          },
        },
        include: { detalles: true },
      });

      res.status(201).json({
        success: true,
        message: 'Orden de compra creada exitosamente',
        data: ordenCompra,
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener órdenes de compra
  async getOrdenesCompra(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, pagina = 1, limite = 20 } = req.query;

      const where: any = {};
      if (estado) where.estado = estado as string;

      const skip = (Number(pagina) - 1) * Number(limite);

      const [ordenes, total] = await Promise.all([
        prisma.inv_ordenes_compra.findMany({
          where,
          include: {
            proveedor: true,
            detalles: {
              include: {
                producto: {
                  select: {
                    nombre: true,
                    sku: true,
                  },
                },
              },
            },
          },
          skip,
          take: Number(limite),
          orderBy: { created_at: 'desc' },
        }),
        prisma.inv_ordenes_compra.count({ where }),
      ]);

      res.json({
        success: true,
        data: ordenes,
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        totalPaginas: Math.ceil(total / Number(limite)),
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar estado de orden de compra y recibir mercadería
  async recibirMercaderia(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { items_recibidos, observaciones } = req.body;

      const ordenCompra = await prisma.inv_ordenes_compra.findUnique({
        where: { id },
        include: {
          detalles: true,
        },
      });

      if (!ordenCompra) {
        throw new AppError('Orden de compra no encontrada', 404);
      }

      // Actualizar stock para cada item recibido
      for (const item of items_recibidos || ordenCompra.detalles) {
        const detalle = ordenCompra.detalles.find(d => d.producto_id === item.producto_id);
        if (!detalle) continue;

        const cantidadRecibida = item.cantidad_recibida || detalle.cantidad;
        
        // Obtener stock actual
        const stock = await prisma.inv_stock_producto.findUnique({
          where: { producto_id: item.producto_id },
        });

        const stockAntes = stock ? stock.stock_fisico : 0;
        const stockDespues = stockAntes + cantidadRecibida;

        // Actualizar o crear stock
        await prisma.inv_stock_producto.upsert({
          where: { producto_id: item.producto_id },
          update: {
            stock_fisico: { increment: cantidadRecibida },
          },
          create: {
            producto_id: item.producto_id,
            stock_fisico: cantidadRecibida,
            stock_reservado: 0,
            stock_minimo: 0,
          },
        });

        // Registrar movimiento de entrada
        await prisma.inv_movimientos_inventario.create({
          data: {
            producto_id: item.producto_id,
            tipo_movimiento: 'entrada',
            cantidad: cantidadRecibida,
            stock_antes: stockAntes,
            stock_despues: stockDespues,
            motivo: `Recepción de orden de compra ${ordenCompra.numero_oc}`,
            referencia_id: id,
            usuario_id: (req as AuthRequest).user?.id,
          },
        });
      }

      // Registrar recepción
      const recepcion = await prisma.inv_recepciones.upsert({
        where: { orden_compra_id: id },
        update: {
          fecha_recepcion: new Date(),
          observaciones: observaciones || undefined,
          recibido_por: (req as AuthRequest).user?.id,
        },
        create: {
          orden_compra_id: id,
          fecha_recepcion: new Date(),
          observaciones: observaciones || undefined,
          recibido_por: (req as AuthRequest).user?.id,
          estado: 'completada',
        },
      });

      // Actualizar estado de la orden de compra
      const actualizada = await prisma.inv_ordenes_compra.update({
        where: { id },
        data: {
          estado: 'recibida',
          updated_at: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Mercadería recibida y stock actualizado',
        data: {
          orden: actualizada,
          recepcion,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar estado de orden de compra
  async actualizarEstadoOrdenCompra(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { estado, observaciones } = req.body;

      const ordenCompra = await prisma.inv_ordenes_compra.findUnique({
        where: { id },
      });

      if (!ordenCompra) {
        throw new AppError('Orden de compra no encontrada', 404);
      }

      const actualizada = await prisma.inv_ordenes_compra.update({
        where: { id },
        data: {
          estado,
          updated_at: new Date(),
        },
      });

      res.json({
        success: true,
        message: `Estado actualizado a ${estado}`,
        data: actualizada,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cuentas por pagar basicas (ordenes pendientes y parciales)
  async getCuentasPorPagar(req: Request, res: Response, next: NextFunction) {
    try {
      const { proveedor_id } = req.query;
      const where: any = { estado: { in: ['pendiente', 'aprobada', 'parcial'] } };
      if (proveedor_id) where.proveedor_id = Number(proveedor_id);

      const ordenes = await prisma.inv_ordenes_compra.findMany({
        where,
        include: { proveedor: true },
        orderBy: { fecha_emision: 'desc' },
      });

      const totalPendiente = ordenes.reduce((acc, oc) => acc + Number(oc.total), 0);
      res.json({
        success: true,
        data: {
          total_pendiente: totalPendiente,
          cuentas: ordenes.map((oc) => ({
            id: oc.id,
            numero_oc: oc.numero_oc,
            proveedor: oc.proveedor.razon_social,
            fecha_emision: oc.fecha_emision,
            estado: oc.estado,
            monto_pendiente: Number(oc.total),
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los proveedores
  async getProveedores(req: Request, res: Response, next: NextFunction) {
    try {
      const { pagina = 1, limite = 20, filtro = '', activos } = req.query;
      const skip = (Number(pagina) - 1) * Number(limite);

      const where: any = {};
      if (activos !== undefined) {
        where.activo = activos === 'true';
      }

      if (filtro) {
        where.OR = [
          { razon_social: { contains: filtro, mode: 'insensitive' } },
          { ruc: { contains: filtro as string, mode: 'insensitive' } },
          { email: { contains: filtro as string, mode: 'insensitive' } },
        ];
      }

      const [proveedores, total] = await Promise.all([
        prisma.inv_proveedores.findMany({
          where,
          include: {
            ordenes_compra: {
              select: { id: true },
            },
          },
          skip,
          take: Number(limite),
          orderBy: { created_at: 'desc' },
        }),
        prisma.inv_proveedores.count({ where }),
      ]);

      res.json({
        success: true,
        data: proveedores.map(p => ({
          ...p,
          ordenes_totales: p.ordenes_compra.length,
        })),
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        totalPaginas: Math.ceil(total / Number(limite)),
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo proveedor
  async createProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const { razon_social, ruc, email, telefono, direccion } = req.body;

      // Validar que el RUC sea único
      const existente = await prisma.inv_proveedores.findUnique({
        where: { ruc },
      });

      if (existente) {
        throw new AppError('Ya existe un proveedor con este RUC', 409);
      }

      const proveedor = await prisma.inv_proveedores.create({
        data: {
          razon_social,
          ruc,
          email: email || null,
          telefono: telefono || null,
          direccion: direccion || null,
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

  // Actualizar proveedor
  async updateProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { razon_social, email, telefono, direccion, activo } = req.body;

      const proveedor = await prisma.inv_proveedores.findUnique({
        where: { id },
      });

      if (!proveedor) {
        throw new AppError('Proveedor no encontrado', 404);
      }

      const actualizado = await prisma.inv_proveedores.update({
        where: { id },
        data: {
          razon_social: razon_social || proveedor.razon_social,
          email: email || proveedor.email,
          telefono: telefono || proveedor.telefono,
          direccion: direccion || proveedor.direccion,
          activo: activo !== undefined ? activo : proveedor.activo,
        },
      });

      res.json({
        success: true,
        message: 'Proveedor actualizado',
        data: actualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  // Realizar ajuste de stock (POST /api/v1/inventario/ajustes)
  async realizarAjuste(req: Request, res: Response, next: NextFunction) {
    try {
      const { producto_id, cantidad, tipo, motivo } = req.body;

      // Validar datos
      if (!producto_id || cantidad === undefined || !tipo || !motivo) {
        throw new AppError('Faltan campos requeridos', 400);
      }

      if (typeof cantidad !== 'number' || cantidad === 0) {
        throw new AppError('La cantidad debe ser un número diferente de 0', 400);
      }

      // Obtener stock actual
      const stock = await prisma.inv_stock_producto.findUnique({
        where: { producto_id },
      });

      if (!stock) {
        throw new AppError('Stock del producto no encontrado', 404);
      }

      const stockAntes = stock.stock_fisico;
      let stockDespues: number;

      // Calcular nuevo stock según el tipo de ajuste
      if (tipo === 'positivo') {
        stockDespues = stockAntes + Math.abs(cantidad);
      } else if (tipo === 'negativo') {
        if (stockAntes < Math.abs(cantidad)) {
          throw new AppError('Stock insuficiente para hacer ajuste negativo', 400);
        }
        stockDespues = stockAntes - Math.abs(cantidad);
      } else {
        throw new AppError('Tipo de ajuste inválido (positivo/negativo)', 400);
      }

      // Actualizar stock
      const stockActualizado = await prisma.inv_stock_producto.update({
        where: { producto_id },
        data: { stock_fisico: stockDespues },
      });

      // Registrar movimiento
      const movimiento = await prisma.inv_movimientos_inventario.create({
        data: {
          producto_id,
          tipo_movimiento: 'ajuste',
          cantidad: Math.abs(cantidad),
          stock_antes: stockAntes,
          stock_despues: stockDespues,
          motivo,
          usuario_id: (req as AuthRequest).user?.id,
        },
      });

      res.json({
        success: true,
        message: 'Ajuste de stock realizado exitosamente',
        data: {
          stock: stockActualizado,
          movimiento,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

