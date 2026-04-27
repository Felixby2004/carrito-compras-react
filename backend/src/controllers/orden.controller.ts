import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import PDFDocument from 'pdfkit';
import { sendOrderStatusEmail } from '../utils/email';

const prisma = new PrismaClient();

const crearOrdenSchema = z.object({
  items: z.array(z.object({
    producto_id: z.number(),
    nombre: z.string(),
    cantidad: z.number(),
    precio_unitario: z.number(),
    subtotal: z.number(),
  })),
  subtotal: z.number(),
  impuesto: z.number(),
  total: z.number(),
  costo_envio: z.number(),
  direccion: z.object({
    nombre: z.string(),
    apellido: z.string(),
    direccion: z.string(),
    ciudad: z.string(),
    departamento: z.string().optional(),
    codigo_postal: z.string().optional(),
    telefono: z.string(),
  }),
  metodo_envio_id: z.number(),
  metodo_pago: z.number(),
  cupon_codigo: z.string().optional(),
  identificacion: z.object({
    tipo: z.enum(['invitado', 'login', 'registro']),
    email: z.string().email().optional(),
    password: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
  }),
});

const cambiarEstadoSchema = z.object({
  estado: z.enum(['pendiente_pago', 'pagada', 'en_proceso', 'enviada', 'entregada', 'cancelada', 'devuelta', 'cancelado', 'devuelto']),
  comentario: z.string().optional(),
  motivo_devolucion: z.string().optional(),
  reembolso: z.number().min(0).optional(),
  tracking_numero: z.string().optional(),
});

const estadosPermitidos = new Set(['pendiente_pago', 'pagada', 'en_proceso', 'enviada', 'entregada', 'cancelada', 'devuelta']);
const transicionesValidas: Record<string, string[]> = {
  pendiente_pago: ['pagada', 'cancelada'],
  pagada: ['en_proceso', 'cancelada', 'devuelta'],
  en_proceso: ['enviada', 'cancelada', 'devuelta'],
  enviada: ['entregada', 'devuelta'],
  entregada: ['devuelta'],
  cancelada: [],
  devuelta: [],
};

const normalizarEstado = (estado: string) => {
  if (estado === 'cancelado') return 'cancelada';
  if (estado === 'devuelto') return 'devuelta';
  return estado;
};

export class OrdenController {
  
  async crearOrden(req: Request, res: Response, next: NextFunction) {
    try {
      const data = crearOrdenSchema.parse(req.body);
      
      // Generar número de orden único
      const ordenNumero = 'ORD-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
      
      let clienteId: number | null = null;
      let usuarioId: number | null = null;
      let nuevoUsuario: any = null;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      const authReq = req as AuthRequest;
      
      // Paso 1: Identificar o crear usuario/cliente
      if (authReq.user?.id) {
        usuarioId = authReq.user.id;
        const cliente = await prisma.cli_clientes.findUnique({ where: { usuario_id: authReq.user.id } });
        if (cliente) clienteId = cliente.id;
      }
      else if (data.identificacion.tipo === 'login' && data.identificacion.email) {
        const usuario = await prisma.seg_usuarios.findUnique({
          where: { email: data.identificacion.email },
        });
        if (!usuario) {
          throw new AppError('Credenciales inválidas', 401);
        }
        
        const isValid = await bcrypt.compare(data.identificacion.password || '', usuario.password_hash);
        if (!isValid) {
          throw new AppError('Credenciales inválidas', 401);
        }
        
        usuarioId = usuario.id;
        const cliente = await prisma.cli_clientes.findUnique({
          where: { usuario_id: usuario.id },
        });
        if (cliente) {
          clienteId = cliente.id;
        }
      } 
      else if (data.identificacion.tipo === 'registro' && data.identificacion.email) {
        const hashedPassword = await bcrypt.hash(data.identificacion.password || 'Temp123!', 12);
        
        nuevoUsuario = await prisma.seg_usuarios.create({
          data: {
            email: data.identificacion.email,
            password_hash: hashedPassword,
            email_verificado: true,
            activo: true,
          },
        });
        usuarioId = nuevoUsuario.id;
        
        const rolCliente = await prisma.seg_roles.findFirst({
          where: { nombre: 'cliente' },
        });
        if (rolCliente) {
          await prisma.seg_usuario_rol.create({
            data: {
              usuario_id: nuevoUsuario.id,
              rol_id: rolCliente.id,
            },
          });
        }
        
        const nuevoCliente = await prisma.cli_clientes.create({
          data: {
            usuario_id: nuevoUsuario.id,
            telefono: data.direccion.telefono,
            total_gastado: 0,
            segmento: 'nuevo',
          },
        });
        clienteId = nuevoCliente.id;
        
        // Generar tokens para el nuevo usuario
        accessToken = jwt.sign(
          { id: nuevoUsuario.id, email: nuevoUsuario.email },
          config.jwtSecret,
          { expiresIn: '15m' }
        );
        refreshToken = crypto.randomBytes(40).toString('hex');
        
        await prisma.seg_refresh_tokens.create({
          data: {
            usuario_id: nuevoUsuario.id,
            token: refreshToken,
            expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            revocado: false,
          },
        });
      }
      else if (data.identificacion.tipo === 'invitado') {
        const usuarioInvitado = await prisma.seg_usuarios.create({
          data: {
            email: `invitado_${Date.now()}@temp.com`,
            password_hash: await bcrypt.hash('temp', 12),
            email_verificado: false,
            activo: true,
          },
        });
        usuarioId = usuarioInvitado.id;
        
        const clienteInvitado = await prisma.cli_clientes.create({
          data: {
            usuario_id: usuarioInvitado.id,
            telefono: data.direccion.telefono,
            total_gastado: 0,
            segmento: 'invitado',
          },
        });
        clienteId = clienteInvitado.id;
      }
      
      if (!clienteId) {
        throw new AppError('No se pudo identificar al cliente', 400);
      }
      
      // Paso 2: Crear la orden
      let cuponId: number | undefined;
      let descuentoCalculado = 0;
      if (data.cupon_codigo) {
        const cupon = await prisma.ord_cupones.findFirst({
          where: {
            codigo: data.cupon_codigo.toUpperCase(),
            activo: true,
            fecha_inicio: { lte: new Date() },
            fecha_fin: { gte: new Date() },
          },
        });
        if (cupon) {
          descuentoCalculado = cupon.tipo === 'porcentaje'
            ? data.subtotal * (Number(cupon.valor) / 100)
            : Number(cupon.valor);
          descuentoCalculado = Math.min(descuentoCalculado, data.subtotal);
          cuponId = cupon.id;
        }
      }

      const metodoEnvio =
        typeof data.metodo_envio_id === 'number'
          ? await prisma.ord_metodos_envio.findUnique({ where: { id: data.metodo_envio_id } })
          : null;
      const metodoEnvioFinal =
        metodoEnvio ||
        (await prisma.ord_metodos_envio.findFirst({
          orderBy: { id: 'asc' },
        }));
      if (!metodoEnvioFinal) {
        throw new AppError('No hay métodos de envío configurados', 500);
      }

      const orden = await prisma.ord_ordenes.create({
        data: {
          orden_numero: ordenNumero,
          cliente_id: clienteId,
          cupon_id: cuponId,
          subtotal: data.subtotal,
          impuesto: data.impuesto,
          descuento: descuentoCalculado,
          costo_envio: data.costo_envio,
          total: data.total - descuentoCalculado,
          estado: 'pagada',
          metodo_pago: data.metodo_pago === 1 ? 'tarjeta' : data.metodo_pago === 2 ? 'transferencia' : 'contra_entrega',
          metodo_envio_id: metodoEnvioFinal.id,
        },
      });
      
      // Paso 3: Crear items de la orden y actualizar stock
      for (const item of data.items) {
        await prisma.ord_items_orden.create({
          data: {
            orden_id: orden.id,
            producto_id: item.producto_id,
            nombre_producto: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          },
        });
        
        const stockExistente = await prisma.inv_stock_producto.findUnique({
          where: { producto_id: item.producto_id },
        });
        
        if (stockExistente) {
          const stockDisponible = stockExistente.stock_fisico - stockExistente.stock_reservado;
          if (stockDisponible < item.cantidad) {
            throw new AppError(`Stock insuficiente para producto ${item.producto_id}`, 400);
          }
          await prisma.inv_stock_producto.update({
            where: { producto_id: item.producto_id },
            data: { stock_fisico: { decrement: item.cantidad } },
          });
        }
        
        await prisma.cat_productos.update({
          where: { id: item.producto_id },
          data: { ventas_totales: { increment: item.cantidad } },
        });
      }
      
      // Paso 4: Crear dirección de envío
      await prisma.ord_direcciones_envio.create({
        data: {
          orden_id: orden.id,
          cliente_id: clienteId,
          direccion_completa: data.direccion.direccion,
          ciudad: data.direccion.ciudad,
          departamento: data.direccion.departamento || '',
          codigo_postal: data.direccion.codigo_postal || '',
          telefono: data.direccion.telefono,
          destinatario: `${data.direccion.nombre} ${data.direccion.apellido}`,
        },
      });

      // Guardar dirección como favorita para el cliente (si es login/registro, no invitado)
      if (usuarioId && data.identificacion.tipo !== 'invitado') {
        await prisma.cli_clientes.update({
          where: { id: clienteId },
          data: { telefono: data.direccion.telefono },
        });
        await prisma.configuracion_sistema.upsert({
          where: { clave: `perfil_usuario_${usuarioId}` },
          update: {
            valor: JSON.stringify({ nombre: data.direccion.nombre, apellido: data.direccion.apellido }),
            descripcion: 'Perfil basico de usuario',
          },
          create: {
            clave: `perfil_usuario_${usuarioId}`,
            valor: JSON.stringify({ nombre: data.direccion.nombre, apellido: data.direccion.apellido }),
            descripcion: 'Perfil basico de usuario',
          },
        });

        const direccionExistente = await prisma.cli_direcciones.findFirst({
          where: {
            cliente_id: clienteId,
            direccion_completa: data.direccion.direccion,
            ciudad: data.direccion.ciudad,
          },
        });
        
        if (!direccionExistente) {
          await prisma.cli_direcciones.create({
            data: {
              cliente_id: clienteId,
              alias: 'Mi dirección',
              direccion_completa: data.direccion.direccion,
              ciudad: data.direccion.ciudad,
              departamento: data.direccion.departamento || '',
              codigo_postal: data.direccion.codigo_postal || '',
              telefono: data.direccion.telefono,
              es_principal: true,
            },
          });
        }
      }
      
      // Paso 5: Registrar pago
      await prisma.ord_pagos.create({
        data: {
          orden_id: orden.id,
          monto: data.total - descuentoCalculado,
          metodo: data.metodo_pago === 1 ? 'tarjeta' : data.metodo_pago === 2 ? 'transferencia' : 'contra_entrega',
          estado_pago: 'completado',
          fecha_pago: new Date(),
          transaccion_id: `TRX-${Date.now()}`,
        },
      });
      
      // Paso 6: Registrar historial
      await prisma.ord_historial_estados.create({
        data: {
          orden_id: orden.id,
          estado_anterior: 'pendiente_pago',
          estado_nuevo: 'pagada',
          comentario: 'Pago completado',
          usuario_id: usuarioId || undefined,
        },
      });
      
      // Paso 7: Respuesta exitosa
      if (cuponId) {
        await prisma.ord_cupones.update({
          where: { id: cuponId },
          data: { usos_actuales: { increment: 1 } },
        });
      }

      await prisma.cli_clientes.update({
        where: { id: clienteId },
        data: {
          total_gastado: { increment: data.total - descuentoCalculado },
          fecha_ultima_compra: new Date(),
        },
      });

      // Convertir Decimal a número
      const ordenConvertida = this.convertDecimalToNumber(JSON.parse(JSON.stringify(orden)));
      
        if (data.identificacion.tipo === 'registro' && accessToken && refreshToken) {
        res.json({
            success: true,
            data: { 
            orden: ordenConvertida, 
            ordenNumero,
            accessToken,
            refreshToken,
            user: {
                id: nuevoUsuario.id,
                email: nuevoUsuario.email,
                roles: ['cliente']
            }
            },
            message: '¡Orden completada con éxito! Usuario registrado.',
        });
        } else {
            // Para login e invitado, solo devolver la orden
            res.json({
                success: true,
                data: { orden: ordenConvertida, ordenNumero },
                message: '¡Orden completada con éxito!',
            });
        }
      
    } catch (error) {
        console.error('Error en crearOrden:', error instanceof Error ? error.message : error);
        next(error);
    }
  }
  
  async getMisOrdenes(req: AuthRequest, res: Response, next: NextFunction) {
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
      
      const { estado, fecha_desde, fecha_hasta } = req.query;
      const where: any = { cliente_id: cliente.id };
      if (estado && estadosPermitidos.has(String(estado))) {
        where.estado = String(estado);
      }
      if (fecha_desde || fecha_hasta) {
        where.fecha_orden = {};
        if (fecha_desde) where.fecha_orden.gte = new Date(String(fecha_desde));
        if (fecha_hasta) {
          const hasta = new Date(String(fecha_hasta));
          hasta.setHours(23, 59, 59, 999);
          where.fecha_orden.lte = hasta;
        }
      }

      const ordenes = await prisma.ord_ordenes.findMany({
        where,
        include: {
          items: true,
          direccion_envio: true,
          historial_estados: {
            orderBy: { fecha_cambio: 'desc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
      });
      
      // Convertir Decimal a número
      const ordenesConvertidas = ordenes.map(orden => 
        this.convertDecimalToNumber(JSON.parse(JSON.stringify(orden)))
      );
      
      res.json({ success: true, data: ordenesConvertidas });
    } catch (error) {
      next(error);
    }
  }

  async getMiOrdenById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const id = parseInt(req.params.id);

      const cliente = await prisma.cli_clientes.findUnique({ where: { usuario_id: req.user.id } });
      if (!cliente) throw new AppError('Cliente no encontrado', 404);

      const orden = await prisma.ord_ordenes.findFirst({
        where: { id, cliente_id: cliente.id },
        include: {
          items: true,
          direccion_envio: true,
          pagos: true,
          historial_estados: { orderBy: { fecha_cambio: 'asc' } },
        },
      });
      if (!orden) throw new AppError('Orden no encontrada', 404);

      const ordenConvertida = this.convertDecimalToNumber(JSON.parse(JSON.stringify(orden)));
      res.json({ success: true, data: ordenConvertida });
    } catch (error) {
      next(error);
    }
  }
  
  async getOrdenById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      
      const orden = await prisma.ord_ordenes.findUnique({
        where: { id },
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
      
      // Convertir Decimal a número
      const ordenConvertida = this.convertDecimalToNumber(JSON.parse(JSON.stringify(orden)));
      
      res.json({ success: true, data: ordenConvertida });
    } catch (error) {
      next(error);
    }
  }

  // Convertir Decimal a número
  private convertDecimalToNumber(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.map(item => this.convertDecimalToNumber(item));
      }
      
      // Convertir Decimal objects y strings numéricos
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Verifica si es un Decimal de Prisma
            if (obj[key].constructor.name === 'Decimal' || obj[key]._isDecimal === true) {
              obj[key] = parseFloat(obj[key].toString());
            } else {
              obj[key] = this.convertDecimalToNumber(obj[key]);
            }
          }
        }
      }
    }
    
    return obj;
  }

  // Obtener todas las órdenes (admin)
    async getOrdenesAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const { estado, fecha, cliente, page = 1, limit = 20, monto_min, monto_max } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        const where: any = {};
        
        if (estado) where.estado = estado as string;
        if (cliente) where.cliente_id = parseInt(cliente as string);
        if (fecha) {
        const fechaObj = new Date(fecha as string);
        where.created_at = {
            gte: new Date(fechaObj.setHours(0, 0, 0, 0)),
            lte: new Date(fechaObj.setHours(23, 59, 59, 999)),
        };
        }
        if (monto_min || monto_max) {
          where.total = {};
          if (monto_min) where.total.gte = Number(monto_min);
          if (monto_max) where.total.lte = Number(monto_max);
        }
        
        const [ordenes, total] = await Promise.all([
        prisma.ord_ordenes.findMany({
            where,
            include: {
            cliente: {
                include: {
                usuario: {
                    select: { email: true },
                },
                },
            },
            items: true,
            direccion_envio: true,
            pagos: true,
            historial_estados: {
                orderBy: { fecha_cambio: 'desc' },
            },
            },
            skip,
            take: Number(limit),
            orderBy: { created_at: 'desc' },
        }),
        prisma.ord_ordenes.count({ where }),
        ]);
        
        // Convertir Decimal a número
        const ordenesConvertidas = ordenes.map(orden => 
          this.convertDecimalToNumber(JSON.parse(JSON.stringify(orden)))
        );
        
        res.json({
        success: true,
        data: ordenesConvertidas,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        next(error);
    }
    }

    // Cambiar estado de una orden
    async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseInt(req.params.id);
        const { estado, comentario, motivo_devolucion, reembolso, tracking_numero } = cambiarEstadoSchema.parse(req.body);
        const estadoDestino = normalizarEstado(estado);
        const roles = (req as AuthRequest).user?.roles || [];
        if (roles.includes('vendedor')) {
          const permitidoVendedor = new Set(['en_proceso', 'enviada']);
          if (!permitidoVendedor.has(estadoDestino)) {
            throw new AppError('El rol vendedor solo puede marcar En proceso o Enviada', 403);
          }
        }
        
        const orden = await prisma.ord_ordenes.findUnique({
        where: { id },
        include: {
            items: true,
        },
        });
        
        if (!orden) {
        throw new AppError('Orden no encontrada', 404);
        }
        
        const estadoAnterior = normalizarEstado(orden.estado);
        const permitido = transicionesValidas[estadoAnterior] || [];
        if (!permitido.includes(estadoDestino)) {
          throw new AppError(`Transición no permitida: ${estadoAnterior} -> ${estadoDestino}`, 400);
        }
        
        // Actualizar orden
        const ordenActualizada = await prisma.ord_ordenes.update({
        where: { id },
        data: { estado: estadoDestino, tracking_numero: tracking_numero || orden.tracking_numero },
        });
        
        // Registrar historial
        await prisma.ord_historial_estados.create({
        data: {
            orden_id: id,
            estado_anterior: estadoAnterior,
            estado_nuevo: estadoDestino,
            comentario: comentario || `Estado cambiado a ${estadoDestino}`,
            usuario_id: (req as AuthRequest).user?.id,
        },
        });
        
        // Si es devolución, actualizar inventario
        if (estadoDestino === 'devuelta') {
        for (const item of orden.items) {
            // Obtener stock actual antes de la devolución
            const stockActual = await prisma.inv_stock_producto.findUnique({
            where: { producto_id: item.producto_id },
            });
            
            const stockAntes = stockActual ? stockActual.stock_fisico : 0;
            const stockDespues = stockAntes + item.cantidad;
            
            // Actualizar stock
            await prisma.inv_stock_producto.upsert({
            where: { producto_id: item.producto_id },
            update: { stock_fisico: { increment: item.cantidad } },
            create: {
                producto_id: item.producto_id,
                stock_fisico: item.cantidad,
                stock_reservado: 0,
                stock_minimo: 0,
            },
            });
            
            // Registrar movimiento de devolución con todos los campos requeridos
            await prisma.inv_movimientos_inventario.create({
            data: {
                producto_id: item.producto_id,
                tipo_movimiento: 'entrada',
                cantidad: item.cantidad,
                stock_antes: stockAntes,
                stock_despues: stockDespues,
                motivo: `Devolución de orden ${orden.orden_numero}: ${motivo_devolucion || 'Sin motivo'}`,
                referencia_id: id,
            },
            });
        }
        
        // Registrar reembolso
        if (reembolso && reembolso > 0) {
            await prisma.ord_pagos.create({
            data: {
                orden_id: id,
                monto: reembolso,
                metodo: 'reembolso',
                estado_pago: 'completado',
                fecha_pago: new Date(),
            },
            });
        }
        }
        
        const cliente = await prisma.cli_clientes.findUnique({
          where: { id: orden.cliente_id },
          include: { usuario: true },
        });
        if (cliente?.usuario?.email) {
          try {
            await sendOrderStatusEmail(cliente.usuario.email, orden.orden_numero, estadoDestino, comentario);
          } catch {
            // best-effort: no bloquear el cambio de estado si falla SMTP
          }
        }

        res.json({
        success: true,
        message: `Estado actualizado a ${estadoDestino}`,
        data: this.convertDecimalToNumber(JSON.parse(JSON.stringify(ordenActualizada))),
        });
    } catch (error) {
        next(error);
    }
    }

  async cancelarMiOrden(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const id = parseInt(req.params.id);
      const ventanaMinutos = Number(req.query.ventana_minutos || 60);
      const { comentario } = req.body || {};

      const cliente = await prisma.cli_clientes.findUnique({ where: { usuario_id: req.user.id } });
      if (!cliente) throw new AppError('Cliente no encontrado', 404);

      const orden = await prisma.ord_ordenes.findFirst({
        where: { id, cliente_id: cliente.id },
        include: { items: true },
      });
      if (!orden) throw new AppError('Orden no encontrada', 404);
      if (!['pendiente_pago', 'pagada'].includes(orden.estado)) {
        throw new AppError('La orden no puede cancelarse en su estado actual', 400);
      }

      const minutosTranscurridos = (Date.now() - new Date(orden.fecha_orden).getTime()) / 60000;
      if (minutosTranscurridos > ventanaMinutos) {
        throw new AppError(`La ventana de cancelación (${ventanaMinutos} min) ya expiró`, 400);
      }

      await prisma.$transaction(async (tx) => {
        await tx.ord_ordenes.update({ where: { id }, data: { estado: 'cancelada' } });
        await tx.ord_historial_estados.create({
          data: {
            orden_id: id,
            estado_anterior: orden.estado,
            estado_nuevo: 'cancelada',
            comentario: comentario || 'Cancelada por cliente dentro de ventana permitida',
            usuario_id: req.user!.id,
          },
        });

        for (const item of orden.items) {
          const stock = await tx.inv_stock_producto.findUnique({ where: { producto_id: item.producto_id } });
          if (stock) {
            await tx.inv_stock_producto.update({
              where: { producto_id: item.producto_id },
              data: {
                stock_reservado: {
                  decrement: Math.min(stock.stock_reservado, item.cantidad),
                },
              },
            });
          }
        }
      });

      try {
        const clienteEmail = await prisma.cli_clientes.findUnique({
          where: { usuario_id: req.user.id },
          include: { usuario: true },
        });
        if (clienteEmail?.usuario?.email) {
          await sendOrderStatusEmail(clienteEmail.usuario.email, orden.orden_numero, 'cancelada', comentario);
        }
      } catch {
        // best-effort
      }

      res.json({ success: true, message: 'Orden cancelada correctamente' });
    } catch (error) {
      next(error);
    }
  }

  async getTracking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const id = parseInt(req.params.id);
      const cliente = await prisma.cli_clientes.findUnique({ where: { usuario_id: req.user.id } });
      if (!cliente) throw new AppError('Cliente no encontrado', 404);

      const orden = await prisma.ord_ordenes.findFirst({
        where: { id, cliente_id: cliente.id },
        include: {
          historial_estados: { orderBy: { fecha_cambio: 'asc' } },
          direccion_envio: true,
        },
      });
      if (!orden) throw new AppError('Orden no encontrada', 404);

      res.json({
        success: true,
        data: {
          orden_id: orden.id,
          orden_numero: orden.orden_numero,
          estado_actual: orden.estado,
          tracking_numero: orden.tracking_numero,
          fecha_entrega: orden.fecha_entrega,
          timeline: orden.historial_estados,
          destino: orden.direccion_envio,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private generarPdfOrden(res: Response, titulo: string, orden: any) {
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${titulo.toLowerCase()}-${orden.orden_numero}.pdf"`);
    doc.pipe(res);

    const fecha = new Date(orden.fecha_orden || orden.created_at).toLocaleString('es-PE');
    const clienteEmail = orden.cliente?.usuario?.email || 'N/A';
    const lineY = () => doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').stroke();
    const writeMoney = (v: unknown) => `S/ ${Number(v || 0).toFixed(2)}`;

    doc.font('Helvetica-Bold').fontSize(20).fillColor('#1d4ed8').text('E-Commerce', 40, 40);
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text('Documento electrónico', 40, 64);
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text(titulo.toUpperCase(), 390, 40, { width: 165, align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor('#334155').text(`Nro: ${orden.orden_numero}`, 390, 62, { width: 165, align: 'right' });
    doc.moveDown(2);
    lineY();
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('Datos del pedido');
    doc.font('Helvetica').fontSize(10).fillColor('#334155');
    doc.text(`Fecha de emisión: ${fecha}`);
    doc.text(`Estado: ${orden.estado}`);
    doc.text(`Método de pago: ${orden.metodo_pago || 'N/A'}`);
    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').text('Cliente');
    doc.font('Helvetica').text(clienteEmail);

    if (orden.direccion_envio) {
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').text('Dirección de envío');
      doc.font('Helvetica')
        .text(orden.direccion_envio.destinatario || '-')
        .text(`${orden.direccion_envio.direccion_completa || '-'}, ${orden.direccion_envio.ciudad || '-'}`);
    }

    doc.moveDown();
    lineY();
    doc.moveDown();

    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
    doc.text('Descripción', 40, tableTop);
    doc.text('Cant.', 320, tableTop, { width: 50, align: 'right' });
    doc.text('P. Unit', 380, tableTop, { width: 80, align: 'right' });
    doc.text('Subtotal', 470, tableTop, { width: 85, align: 'right' });
    doc.moveTo(40, tableTop + 16).lineTo(555, tableTop + 16).strokeColor('#cbd5e1').stroke();

    let y = tableTop + 24;
    doc.font('Helvetica').fontSize(9).fillColor('#334155');
    for (const item of orden.items || []) {
      doc.text(item.nombre_producto || '-', 40, y, { width: 260 });
      doc.text(String(item.cantidad || 0), 320, y, { width: 50, align: 'right' });
      doc.text(writeMoney(item.precio_unitario), 380, y, { width: 80, align: 'right' });
      doc.text(writeMoney(item.subtotal), 470, y, { width: 85, align: 'right' });
      y += 18;
      if (y > 710) {
        doc.addPage();
        y = 50;
      }
    }

    doc.moveTo(40, y + 4).lineTo(555, y + 4).strokeColor('#cbd5e1').stroke();
    y += 14;
    doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
    doc.text('Subtotal:', 410, y, { width: 70, align: 'right' });
    doc.text(writeMoney(orden.subtotal), 485, y, { width: 70, align: 'right' });
    y += 16;
    doc.text('IGV:', 410, y, { width: 70, align: 'right' });
    doc.text(writeMoney(orden.impuesto), 485, y, { width: 70, align: 'right' });
    y += 16;
    doc.text('Envío:', 410, y, { width: 70, align: 'right' });
    doc.text(writeMoney(orden.costo_envio), 485, y, { width: 70, align: 'right' });
    y += 20;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', 410, y, { width: 70, align: 'right' });
    doc.text(writeMoney(orden.total), 485, y, { width: 70, align: 'right' });

    doc.moveDown(2);
    doc.font('Helvetica').fontSize(8).fillColor('#64748b')
      .text('Representación impresa de documento electrónico. Gracias por su compra.', 40, 800 - 40, { align: 'center', width: 515 });
    doc.end();
  }

  async descargarFactura(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const id = parseInt(req.params.id);
      const cliente = await prisma.cli_clientes.findUnique({ where: { usuario_id: req.user.id } });
      if (!cliente) throw new AppError('Cliente no encontrado', 404);
      const orden = await prisma.ord_ordenes.findFirst({
        where: { id, cliente_id: cliente.id },
        include: { items: true, direccion_envio: true, cliente: { include: { usuario: true } } },
      });
      if (!orden) throw new AppError('Orden no encontrada', 404);
      this.generarPdfOrden(res, 'Factura', orden);
    } catch (error) {
      next(error);
    }
  }

  async imprimirDocumentoAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const tipo = String(req.params.tipo || 'factura');
      if (!['factura', 'guia-remision'].includes(tipo)) {
        throw new AppError('Tipo de documento invalido', 400);
      }
      const orden = await prisma.ord_ordenes.findUnique({
        where: { id },
        include: { items: true, direccion_envio: true, cliente: { include: { usuario: true } } },
      });
      if (!orden) throw new AppError('Orden no encontrada', 404);
      this.generarPdfOrden(res, tipo === 'factura' ? 'Factura' : 'Guia de remision', orden);
    } catch (error) {
      next(error);
    }
  }

    // Obtener estadísticas de órdenes para dashboard
    async getEstadisticasOrdenes(req: Request, res: Response, next: NextFunction) {
    try {
        const [total, pendientes, pagadas, enviadas, entregadas, canceladas] = await Promise.all([
        prisma.ord_ordenes.count(),
        prisma.ord_ordenes.count({ where: { estado: 'pendiente_pago' } }),
        prisma.ord_ordenes.count({ where: { estado: 'pagada' } }),
        prisma.ord_ordenes.count({ where: { estado: 'enviada' } }),
        prisma.ord_ordenes.count({ where: { estado: 'entregada' } }),
        prisma.ord_ordenes.count({ where: { estado: 'cancelada' } }),
        ]);
        
        const ventasHoy = await prisma.ord_ordenes.aggregate({
        where: {
            created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            estado: { in: ['pagada', 'entregada'] },
        },
        _sum: { total: true },
        });
        
        // Convertir Decimal a número
        const ventasHoyNumero = ventasHoy._sum.total ? parseFloat(ventasHoy._sum.total.toString()) : 0;
        
        res.json({
        success: true,
        data: {
            total,
            pendientes,
            pagadas,
            enviadas,
            entregadas,
            canceladas,
            ventas_hoy: ventasHoyNumero,
        },
        });
    } catch (error) {
        next(error);
    }
    }
}