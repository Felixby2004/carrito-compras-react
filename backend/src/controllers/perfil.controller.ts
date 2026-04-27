import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const actualizarPerfilSchema = z.object({
  telefono: z.string().optional().or(z.literal('')),
  fecha_nacimiento: z.string().datetime().optional(),
});

const crearDireccionSchema = z.object({
  alias: z.string().min(3, 'Alias debe tener al menos 3 caracteres'),
  direccion_completa: z.string().min(10, 'Dirección debe tener al menos 10 caracteres'),
  ciudad: z.string().min(3, 'Ciudad requerida'),
  departamento: z.string().optional().or(z.literal('')),
  codigo_postal: z.string().optional().or(z.literal('')),
  telefono: z.string().min(7, 'Teléfono inválido'),
  es_principal: z.boolean().optional().default(false),
});

const cambiarPasswordSchema = z.object({
  password_actual: z.string().min(8),
  password_nuevo: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  password_confirmacion: z.string(),
}).refine(data => data.password_nuevo === data.password_confirmacion, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirmacion'],
});

const preferenciasNotificacionSchema = z.object({
  email_promociones: z.boolean().optional().default(true),
  email_estado_orden: z.boolean().optional().default(true),
  email_novedades: z.boolean().optional().default(false),
});

export class PerfilController {
  
  // Obtener perfil del usuario actual
  async obtenerPerfil(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const usuario = await prisma.seg_usuarios.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          email_verificado: true,
          activo: true,
          fecha_ultimo_login: true,
          created_at: true,
          cliente: {
            include: {
              direcciones: true,
              lista_deseos: {
                include: {
                  items: {
                    include: {
                      producto: {
                        select: {
                          id: true,
                          nombre: true,
                          precio_venta: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      
      if (!usuario) {
        throw new AppError('Usuario no encontrado', 404);
      }
      const perfilBase = await prisma.configuracion_sistema.findUnique({
        where: { clave: `perfil_usuario_${req.user.id}` },
      });
      const perfil = perfilBase ? JSON.parse(perfilBase.valor) : {};
      
      res.json({
        success: true,
        data: {
          ...usuario,
          nombre: perfil.nombre || '',
          apellido: perfil.apellido || '',
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Actualizar perfil del usuario
  async actualizarPerfil(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const datos = actualizarPerfilSchema.parse(req.body);
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      const actualizado = await prisma.cli_clientes.update({
        where: { id: cliente.id },
        data: {
          telefono: datos.telefono || undefined,
          fecha_nacimiento: datos.fecha_nacimiento ? new Date(datos.fecha_nacimiento) : undefined,
        },
        include: {
          usuario: {
            select: {
              email: true,
              email_verificado: true,
            },
          },
        },
      });
      
      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: actualizado,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Cambiar contraseña
  async cambiarPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const datos = cambiarPasswordSchema.parse(req.body);
      
      const usuario = await prisma.seg_usuarios.findUnique({
        where: { id: req.user.id },
      });
      
      if (!usuario) {
        throw new AppError('Usuario no encontrado', 404);
      }
      
      // Verificar contraseña actual
      const passwordValida = await bcrypt.compare(datos.password_actual, usuario.password_hash);
      if (!passwordValida) {
        throw new AppError('Contraseña actual incorrecta', 401);
      }
      
      // Hash nueva contraseña
      const nuevoHash = await bcrypt.hash(datos.password_nuevo, 12);
      
      await prisma.seg_usuarios.update({
        where: { id: req.user.id },
        data: { password_hash: nuevoHash },
      });
      
      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener historial de compras
  async obtenerHistorialCompras(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const { pagina = 1, limite = 10 } = req.query;
      const skip = (Number(pagina) - 1) * Number(limite);
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      const [ordenes, total] = await Promise.all([
        prisma.ord_ordenes.findMany({
          where: { cliente_id: cliente.id },
          include: {
            items: {
              include: {
                producto: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
            direccion_envio: true,
            historial_estados: {
              orderBy: { fecha_cambio: 'desc' },
              take: 1,
            },
          },
          skip,
          take: Number(limite),
          orderBy: { created_at: 'desc' },
        }),
        prisma.ord_ordenes.count({ where: { cliente_id: cliente.id } }),
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
  
  // Crear dirección de envío
  async crearDireccion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const datos = crearDireccionSchema.parse(req.body);
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      // Si es principal, desactivar otras direcciones principales
      if (datos.es_principal) {
        await prisma.cli_direcciones.updateMany({
          where: { cliente_id: cliente.id, es_principal: true },
          data: { es_principal: false },
        });
      }
      
      const direccion = await prisma.cli_direcciones.create({
        data: {
          cliente_id: cliente.id,
          alias: datos.alias,
          direccion_completa: datos.direccion_completa,
          ciudad: datos.ciudad,
          departamento: datos.departamento || '',
          codigo_postal: datos.codigo_postal || '',
          telefono: datos.telefono,
          es_principal: datos.es_principal ?? false,
        },
      });
      
      res.status(201).json({
        success: true,
        message: 'Dirección creada exitosamente',
        data: direccion,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener direcciones del usuario
  async obtenerDirecciones(req: AuthRequest, res: Response, next: NextFunction) {
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
      
      const direcciones = await prisma.cli_direcciones.findMany({
        where: { cliente_id: cliente.id },
        orderBy: [{ es_principal: 'desc' }, { created_at: 'desc' }],
      });
      
      res.json({
        success: true,
        data: direcciones,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Actualizar dirección
  async actualizarDireccion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const direccionId = parseInt(req.params.id);
      const datos = crearDireccionSchema.partial().parse(req.body);
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      const direccion = await prisma.cli_direcciones.findUnique({
        where: { id: direccionId },
      });
      
      if (!direccion || direccion.cliente_id !== cliente.id) {
        throw new AppError('Dirección no encontrada', 404);
      }
      
      // Si es principal, desactivar otras
      if (datos.es_principal) {
        await prisma.cli_direcciones.updateMany({
          where: { cliente_id: cliente.id, es_principal: true, id: { not: direccionId } },
          data: { es_principal: false },
        });
      }
      
      const actualizada = await prisma.cli_direcciones.update({
        where: { id: direccionId },
        data: {
          alias: datos.alias,
          direccion_completa: datos.direccion_completa,
          ciudad: datos.ciudad,
          departamento: datos.departamento,
          codigo_postal: datos.codigo_postal,
          telefono: datos.telefono,
          es_principal: datos.es_principal,
        },
      });
      
      res.json({
        success: true,
        message: 'Dirección actualizada exitosamente',
        data: actualizada,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Eliminar dirección
  async eliminarDireccion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const direccionId = parseInt(req.params.id);
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      const direccion = await prisma.cli_direcciones.findUnique({
        where: { id: direccionId },
      });
      
      if (!direccion || direccion.cliente_id !== cliente.id) {
        throw new AppError('Dirección no encontrada', 404);
      }
      
      await prisma.cli_direcciones.delete({
        where: { id: direccionId },
      });
      
      // Si era principal, marcar la primera disponible como principal
      if (direccion.es_principal) {
        const primeraDireccion = await prisma.cli_direcciones.findFirst({
          where: { cliente_id: cliente.id },
        });
        
        if (primeraDireccion) {
          await prisma.cli_direcciones.update({
            where: { id: primeraDireccion.id },
            data: { es_principal: true },
          });
        }
      }
      
      res.json({
        success: true,
        message: 'Dirección eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener lista de deseos
  async obtenerListaDeseos(req: AuthRequest, res: Response, next: NextFunction) {
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
      
      const listaDeseos = await prisma.cli_lista_deseos.findMany({
        where: { cliente_id: cliente.id },
        include: {
          items: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  precio_venta: true,
                },
              },
            },
          },
        },
      });
      
      res.json({
        success: true,
        data: listaDeseos,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Añadir producto a lista de deseos
  async anadirAListaDeseos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const { producto_id } = req.body;
      
      if (!producto_id) {
        throw new AppError('Producto ID requerido', 400);
      }
      
      const cliente = await prisma.cli_clientes.findUnique({
        where: { usuario_id: req.user.id },
      });
      
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }
      
      // Obtener o crear lista de deseos
      let listaDeseos = await prisma.cli_lista_deseos.findFirst({
        where: { cliente_id: cliente.id },
      });
      
      if (!listaDeseos) {
        listaDeseos = await prisma.cli_lista_deseos.create({
          data: {
            cliente_id: cliente.id,
            nombre_lista: 'Mi lista de deseos',
          },
        });
      }
      
      // Verificar si el producto ya está en la lista
      const itemExistente = await prisma.cli_items_lista_deseos.findFirst({
        where: {
          lista_id: listaDeseos.id,
          producto_id,
        },
      });
      
      if (itemExistente) {
        throw new AppError('Producto ya está en la lista de deseos', 409);
      }
      
      const item = await prisma.cli_items_lista_deseos.create({
        data: {
          lista_id: listaDeseos.id,
          producto_id,
        },
      });
      
      res.status(201).json({
        success: true,
        message: 'Producto añadido a la lista de deseos',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Eliminar producto de lista de deseos
  async eliminarDeListaDeseos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const itemId = parseInt(req.params.id);
      
      const item = await prisma.cli_items_lista_deseos.findUnique({
        where: { id: itemId },
        include: {
          lista: {
            include: {
              cliente: true,
            },
          },
        },
      });
      
      if (!item || item.lista.cliente.usuario_id !== req.user.id) {
        throw new AppError('Item no encontrado', 404);
      }
      
      await prisma.cli_items_lista_deseos.delete({
        where: { id: itemId },
      });
      
      res.json({
        success: true,
        message: 'Producto eliminado de la lista de deseos',
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Mover producto de lista de deseos al carrito
  async moverACarrito(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }
      
      const itemId = parseInt(req.params.id);
      
      const item = await prisma.cli_items_lista_deseos.findUnique({
        where: { id: itemId },
        include: {
          lista: {
            include: {
              cliente: true,
            },
          },
          producto: true,
        },
      });
      
      if (!item || item.lista.cliente.usuario_id !== req.user.id) {
        throw new AppError('Item no encontrado', 404);
      }
      
      // Obtener o crear carrito del usuario
      let carrito = await prisma.ord_carritos.findFirst({
        where: { usuario_id: req.user.id },
      });
      
      if (!carrito) {
        carrito = await prisma.ord_carritos.create({
          data: { usuario_id: req.user.id },
        });
      }
      
      // Verificar si el producto ya está en el carrito
      const itemCarrito = await prisma.ord_items_carrito.findFirst({
        where: {
          carrito_id: carrito.id,
          producto_id: item.producto_id,
        },
      });
      
      if (itemCarrito) {
        // Si ya existe, incrementar cantidad
        await prisma.ord_items_carrito.update({
          where: { id: itemCarrito.id },
          data: { cantidad: { increment: 1 } },
        });
      } else {
        // Crear nuevo item en carrito
        await prisma.ord_items_carrito.create({
          data: {
            carrito_id: carrito.id,
            producto_id: item.producto_id,
            cantidad: 1,
            precio_unitario: item.producto.precio_venta,
          },
        });
      }
      
      // Eliminar de lista de deseos
      await prisma.cli_items_lista_deseos.delete({
        where: { id: itemId },
      });
      
      res.json({
        success: true,
        message: 'Producto movido al carrito',
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPreferenciasNotificacion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const clave = `preferencias_notificacion_${req.user.id}`;
      const config = await prisma.configuracion_sistema.findUnique({ where: { clave } });

      const defaults = {
        email_promociones: true,
        email_estado_orden: true,
        email_novedades: false,
      };
      const data = config ? JSON.parse(config.valor) : defaults;
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async actualizarPreferenciasNotificacion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const data = preferenciasNotificacionSchema.parse(req.body);
      const clave = `preferencias_notificacion_${req.user.id}`;

      const upsert = await prisma.configuracion_sistema.upsert({
        where: { clave },
        update: { valor: JSON.stringify(data), descripcion: 'Preferencias de notificacion de usuario' },
        create: {
          clave,
          valor: JSON.stringify(data),
          descripcion: 'Preferencias de notificacion de usuario',
        },
      });

      res.json({ success: true, message: 'Preferencias actualizadas', data: JSON.parse(upsert.valor) });
    } catch (error) {
      next(error);
    }
  }
}
