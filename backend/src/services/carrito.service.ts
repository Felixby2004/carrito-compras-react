import { PrismaClient } from '@prisma/client';
import { AddToCartInput } from '../schemas/carrito.schema';
import { AppError } from '../middlewares/errorHandler';
import config from '../config';

const prisma = new PrismaClient();

export class CarritoService {
  private calcularImpuesto(subtotal: number): number {
    return subtotal * (config.taxPercentage / 100);
  }

  // Método auxiliar para buscar producto por ID
  private async findProductoById(id: number) {
    return prisma.cat_productos.findUnique({
      where: { id, activo: true },
      include: {
        stock: true,
        imagenes: {
          where: { es_principal: true },
          take: 1,
        },
      },
    });
  }
  
  async getCarrito(usuarioId: number | null, sessionId: string | null) {
    // Obtener carrito con todos los datos necesarios
    let carrito = null;
  
    if (usuarioId) {
      carrito = await prisma.ord_carritos.findFirst({
        where: { usuario_id: usuarioId },
        include: {
          items: {
            orderBy: { created_at: 'asc' },
            include: {
              producto: {
                include: {
                  stock: true,
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
    } else if (sessionId) {
      carrito = await prisma.ord_carritos.findFirst({
        where: { session_id: sessionId },
        include: {
          items: {
            orderBy: { created_at: 'asc' },
            include: {
              producto: {
                include: {
                  stock: true,
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
    }
    
    if (!carrito) {
      carrito = await prisma.ord_carritos.create({
        data: {
          usuario_id: usuarioId,
          session_id: sessionId,
        },
        include: {
          items: {
            orderBy: { created_at: 'asc' },
            include: {
              producto: {
                include: {
                  stock: true,
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
    }
    
    const subtotal = carrito.items.reduce((sum: number, item: any) => sum + (Number(item.precio_unitario) * item.cantidad), 0);
    const impuesto = this.calcularImpuesto(subtotal);
    const total = subtotal + impuesto;
    
    // Mapear items con stock disponible
    const itemsConStock = carrito.items.map((item: any) => {
      const stockFisico = item.producto.stock?.stock_fisico ? Number(item.producto.stock.stock_fisico) : 0;
      const stockReservado = item.producto.stock?.stock_reservado ? Number(item.producto.stock.stock_reservado) : 0;
      const stockDisponible = stockFisico - stockReservado;
      
      return {
        id: item.id,
        producto_id: item.producto_id,
        nombre: item.producto.nombre,
        imagen: item.producto.imagenes[0]?.url,
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario),
        subtotal: Number(item.precio_unitario) * item.cantidad,
        stock_disponible: stockDisponible,
      };
    });
    
    return {
      id: carrito.id,
      items: itemsConStock,
      subtotal,
      impuesto,
      total,
    };
  }

  async addToCart(usuarioId: number | null, sessionId: string | null, data: AddToCartInput) {
    const producto = await this.findProductoById(data.producto_id);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }
    
    // Validar stock al agregar
    const stockFisico = producto.stock ? Number(producto.stock.stock_fisico) : 0;
    const stockReservado = producto.stock ? Number(producto.stock.stock_reservado) || 0 : 0;
    const stockDisponible = stockFisico - stockReservado;
      
    if (stockDisponible < data.cantidad) {
      throw new AppError(`Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles.`, 400);
    }

    // Obtener o crear carrito
    let carrito = null;
    
    if (usuarioId) {
      carrito = await prisma.ord_carritos.findFirst({
        where: { usuario_id: usuarioId },
        include: { items: true },
      });
    } else if (sessionId) {
      carrito = await prisma.ord_carritos.findFirst({
        where: { session_id: sessionId },
        include: { items: true },
      });
    }
    
    if (!carrito) {
      carrito = await prisma.ord_carritos.create({
        data: {
          usuario_id: usuarioId,
          session_id: sessionId,
        },
        include: { items: true },
      });
    }
    
    // Calcular precio con descuento si aplica
    const ahora = new Date();
    const precioVenta = Number(producto.precio_venta);
    const precioOferta = producto.precio_oferta ? Number(producto.precio_oferta) : null;
    const tieneOferta = precioOferta !== null &&
      producto.fecha_inicio_oferta &&
      producto.fecha_fin_oferta &&
      new Date(producto.fecha_inicio_oferta) <= ahora &&
      new Date(producto.fecha_fin_oferta) >= ahora;
    
    const precioUnitario = tieneOferta ? precioOferta! : precioVenta;
    
    // Buscar si el producto ya existe en el carrito
    const itemExistente = carrito.items.find(
      (item: any) => item.producto_id === data.producto_id
    );
    
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + data.cantidad;
      
      // Validar stock nuevamente para la suma
      if (nuevaCantidad > stockDisponible) {
        throw new AppError(`No puedes agregar más. Stock disponible: ${stockDisponible}`, 400);
      }
      
      await prisma.ord_items_carrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: nuevaCantidad },
      });
    } else {
      await prisma.ord_items_carrito.create({
        data: {
          carrito_id: carrito.id,
          producto_id: data.producto_id,
          variante_id: data.variante_id || null,
          cantidad: data.cantidad,
          precio_unitario: precioUnitario,
        },
      });
    }
    
    return this.getCarrito(usuarioId, sessionId);
  }

  async updateCartItem(usuarioId: number | null, sessionId: string | null, itemId: number, cantidad: number) {
    // Obtener el item actual
    const item = await prisma.ord_items_carrito.findUnique({
      where: { id: itemId },
      include: {
        carrito: true,
        producto: {
          include: { stock: true },
        },
      },
    });

    if (!item) {
      throw new AppError('Item no encontrado', 404);
    }

    // Verificar pertenencia
    if (usuarioId && item.carrito.usuario_id !== usuarioId) {
      throw new AppError('No autorizado', 403);
    }
    if (!usuarioId && sessionId && item.carrito.session_id !== sessionId) {
      throw new AppError('No autorizado', 403);
    }

    // Obtener stock disponible
    const stockFisico = item.producto.stock ? Number(item.producto.stock.stock_fisico) : 0;
    const stockReservado = item.producto.stock ? Number(item.producto.stock.stock_reservado) || 0 : 0;
    const stockDisponible = stockFisico - stockReservado;

    // Validar que no se exceda el stock
    if (cantidad > stockDisponible) {
      throw new AppError(`Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles.`, 400);
    }

    // Validar cantidad mínima
    if (cantidad < 0) {
      throw new AppError('La cantidad no puede ser negativa', 400);
    }

    if (cantidad === 0) {
      await prisma.ord_items_carrito.delete({ where: { id: itemId } });
    } else {
      await prisma.ord_items_carrito.update({
        where: { id: itemId },
        data: { cantidad },
      });
    }

    return this.getCarrito(usuarioId, sessionId);
  }
  
  async removeCartItem(usuarioId: number | null, sessionId: string | null, itemId: number) {
    const item = await prisma.ord_items_carrito.findUnique({
      where: { id: itemId },
      include: { carrito: true },
    });
    
    if (!item) {
      throw new AppError('Item no encontrado', 404);
    }
    
    if (usuarioId && item.carrito.usuario_id !== usuarioId) {
      throw new AppError('No autorizado', 403);
    }
    if (!usuarioId && sessionId && item.carrito.session_id !== sessionId) {
      throw new AppError('No autorizado', 403);
    }
    
    await prisma.ord_items_carrito.delete({ 
      where: { id: itemId } 
    });
    
    return this.getCarrito(usuarioId, sessionId);
  }
  
  async clearCart(usuarioId: number | null, sessionId: string | null) {
    let carrito = null;
    
    if (usuarioId) {
      carrito = await prisma.ord_carritos.findFirst({ where: { usuario_id: usuarioId } });
    } else if (sessionId) {
      carrito = await prisma.ord_carritos.findFirst({ where: { session_id: sessionId } });
    }
    
    if (carrito) {
      await prisma.ord_items_carrito.deleteMany({ where: { carrito_id: carrito.id } });
    }
    
    return this.getCarrito(usuarioId, sessionId);
  }
  
  async mergeCart(usuarioId: number, sessionId: string) {
    const carritoInvitado = await prisma.ord_carritos.findFirst({
      where: { session_id: sessionId },
      include: { items: true },
    });
    
    if (carritoInvitado) {
      let carritoUsuario = await prisma.ord_carritos.findFirst({
        where: { usuario_id: usuarioId },
        include: { items: true },
      });
      
      if (!carritoUsuario) {
        carritoUsuario = await prisma.ord_carritos.create({
          data: { usuario_id: usuarioId },
          include: { items: true },
        });
      }
      
      for (const item of carritoInvitado.items) {
        const existingItem = carritoUsuario.items.find(
          (i: any) => i.producto_id === item.producto_id
        );
        
        if (existingItem) {
          await prisma.ord_items_carrito.update({
            where: { id: existingItem.id },
            data: { cantidad: existingItem.cantidad + item.cantidad },
          });
        } else {
          await prisma.ord_items_carrito.create({
            data: {
              carrito_id: carritoUsuario.id,
              producto_id: item.producto_id,
              variante_id: item.variante_id,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
            },
          });
        }
      }
      
      await prisma.ord_carritos.delete({ where: { id: carritoInvitado.id } });
    }
    
    return this.getCarrito(usuarioId, null);
  }
}