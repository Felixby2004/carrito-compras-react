import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import config from '../config';

const prisma = new PrismaClient();

export class OrdenService {
  
  // Crear una nueva orden desde el carrito
  async crearOrden(
    clienteId: number,
    carritoId: number,
    direccionEnvio: any,
    metodoPago: string,
    cuponId?: number
  ) {
    // Obtener carrito con items
    const carrito = await prisma.ord_carritos.findUnique({
      where: { id: carritoId },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!carrito || carrito.items.length === 0) {
      throw new AppError('El carrito está vacío', 400);
    }

    // Calcular totales
    let subtotal = 0;
    const itemsOrden = carrito.items.map((item: any) => {
      const precio = Number(item.precio_unitario);
      const subtotalItem = precio * item.cantidad;
      subtotal += subtotalItem;
      return {
        producto_id: item.producto_id,
        nombre_producto: item.producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: precio,
        subtotal: subtotalItem,
      };
    });

    const impuesto = subtotal * (config.taxPercentage / 100);
    let descuento = 0;

    // Aplicar cupón si existe
    if (cuponId) {
      const cupon = await prisma.ord_cupones.findUnique({
        where: { id: cuponId, activo: true },
      });
      if (cupon && cupon.fecha_inicio <= new Date() && cupon.fecha_fin >= new Date()) {
        if (cupon.tipo === 'porcentaje') {
          descuento = subtotal * (Number(cupon.valor) / 100);
        } else {
          descuento = Number(cupon.valor);
        }
      }
    }

    const total = subtotal + impuesto - descuento;

    // Generar número de orden único
    const ordenNumero = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Crear orden en transacción
    const orden = await prisma.$transaction(async (tx) => {
      // Crear orden
      const nuevaOrden = await tx.ord_ordenes.create({
        data: {
          cliente_id: clienteId,
          orden_numero: ordenNumero,
          subtotal,
          impuesto,
          descuento,
          total,
          estado: 'pendiente_pago',
          metodo_pago: metodoPago,
          cupon_id: cuponId,
        },
      });

      // Crear items de la orden
      for (const item of itemsOrden) {
        await tx.ord_items_orden.create({
          data: {
            orden_id: nuevaOrden.id,
            producto_id: item.producto_id,
            nombre_producto: item.nombre_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          },
        });
      }

      // Crear dirección de envío
      await tx.ord_direcciones_envio.create({
        data: {
          orden_id: nuevaOrden.id,
          cliente_id: clienteId,
          direccion_completa: direccionEnvio.direccion,
          ciudad: direccionEnvio.ciudad,
          departamento: direccionEnvio.departamento,
          codigo_postal: direccionEnvio.codigoPostal,
          telefono: direccionEnvio.telefono,
          destinatario: direccionEnvio.destinatario,
        },
      });

      // Registrar historial de estado
      await tx.ord_historial_estados.create({
        data: {
          orden_id: nuevaOrden.id,
          estado_nuevo: 'pendiente_pago',
          comentario: 'Orden creada',
        },
      });

      // Limpiar carrito
      await tx.ord_items_carrito.deleteMany({
        where: { carrito_id: carritoId },
      });

      return nuevaOrden;
    });

    return orden;
  }

  // Actualizar estado de orden y actualizar popularidad
  async actualizarEstado(ordenId: number, nuevoEstado: string, comentario?: string) {
    const orden = await prisma.ord_ordenes.findUnique({
      where: { id: ordenId },
    });

    if (!orden) {
      throw new AppError('Orden no encontrada', 404);
    }

    const estadoAnterior = orden.estado;

    const ordenActualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.ord_ordenes.update({
        where: { id: ordenId },
        data: { estado: nuevoEstado },
      });

      await tx.ord_historial_estados.create({
        data: {
          orden_id: ordenId,
          estado_anterior: estadoAnterior,
          estado_nuevo: nuevoEstado,
          comentario: comentario || null,
        },
      });

      // Si la orden se confirma (pagada o entregada), actualizar popularidad
      if (nuevoEstado === 'pagada' || nuevoEstado === 'entregada') {
        await this.actualizarPopularidad(ordenId, tx);
      }

      return updated;
    });

    return ordenActualizada;
  }

  // Actualizar popularidad (ventas totales) de productos
  async actualizarPopularidad(ordenId: number, tx: any = prisma) {
    const items = await tx.ord_items_orden.findMany({
      where: { orden_id: ordenId },
    });

    for (const item of items) {
      await tx.cat_productos.update({
        where: { id: item.producto_id },
        data: { ventas_totales: { increment: item.cantidad } },
      });
    }
  }

  // Obtener órdenes de un cliente
  async getOrdenesByCliente(clienteId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [ordenes, total] = await Promise.all([
      prisma.ord_ordenes.findMany({
        where: { cliente_id: clienteId },
        include: {
          items: true,
          direccion_envio: true,
          pagos: true,
          historial_estados: {
            orderBy: { fecha_cambio: 'desc' },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ord_ordenes.count({ where: { cliente_id: clienteId } }),
    ]);

    return {
      data: ordenes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Obtener detalle de una orden
  async getOrdenById(ordenId: number) {
    const orden = await prisma.ord_ordenes.findUnique({
      where: { id: ordenId },
      include: {
        items: true,
        direccion_envio: true,
        pagos: true,
        historial_estados: {
          orderBy: { fecha_cambio: 'asc' },
        },
      },
    });

    if (!orden) {
      throw new AppError('Orden no encontrada', 404);
    }

    return orden;
  }

  // Obtener todas las órdenes (para admin)
  async getAllOrdenes(filters: any = {}, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.estado) where.estado = filters.estado;
    if (filters.cliente_id) where.cliente_id = filters.cliente_id;
    if (filters.fecha_desde) where.fecha_orden = { gte: new Date(filters.fecha_desde) };
    if (filters.fecha_hasta) where.fecha_orden = { ...where.fecha_orden, lte: new Date(filters.fecha_hasta) };

    const [ordenes, total] = await Promise.all([
      prisma.ord_ordenes.findMany({
        where,
        include: {
          cliente: {
            include: {
              usuario: true,
            },
          },
          items: true,
          pagos: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ord_ordenes.count({ where }),
    ]);

    return {
      data: ordenes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}