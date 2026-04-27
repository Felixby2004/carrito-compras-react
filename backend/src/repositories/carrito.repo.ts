import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CarritoRepository {
  
  async findOrCreateCarrito(usuarioId: number | null, sessionId: string | null) {
    
    let carrito = null;
    
    if (usuarioId) {
      carrito = await prisma.ord_carritos.findFirst({
        where: { usuario_id: usuarioId },
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
    } else if (sessionId) {
      carrito = await prisma.ord_carritos.findFirst({
        where: { session_id: sessionId },
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
    }
    
    if (!carrito) {
      carrito = await prisma.ord_carritos.create({
        data: {
          usuario_id: usuarioId,
          session_id: sessionId,
        },
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
    }
    
    return carrito;
  }
  
  async getCarrito(carritoId: number) {
    return prisma.ord_carritos.findUnique({
      where: { id: carritoId },
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
  }

  async updateItem(itemId: number, cantidad: number) {
    if (cantidad <= 0) {
      return prisma.ord_items_carrito.delete({
        where: { id: itemId },
      });
    }
    
    // Actualizar la cantidad del item existente
    return prisma.ord_items_carrito.update({
      where: { id: itemId },
      data: { cantidad },
    });
  }

  async addItem(carritoId: number, productoId: number, varianteId: number | null, cantidad: number, precio: number) {
    
    const existingItem = await prisma.ord_items_carrito.findFirst({
      where: {
        carrito_id: carritoId,
        producto_id: productoId,
        variante_id: varianteId || null,
      },
    });
    
    
    if (existingItem) {
      const nuevaCantidad = existingItem.cantidad + cantidad;
      
      const updated = await prisma.ord_items_carrito.update({
        where: { id: existingItem.id },
        data: { cantidad: nuevaCantidad },
      });
      return updated;
    }
    
    const newItem = await prisma.ord_items_carrito.create({
      data: {
        carrito_id: carritoId,
        producto_id: productoId,
        variante_id: varianteId,
        cantidad,
        precio_unitario: precio,
      },
    });
    return newItem;
  }
  
  async removeItem(itemId: number) {
    return prisma.ord_items_carrito.delete({
      where: { id: itemId },
    });
  }
  
  async clearCarrito(carritoId: number) {
    return prisma.ord_items_carrito.deleteMany({
      where: { carrito_id: carritoId },
    });
  }
  
  async mergeCarritos(usuarioId: number, sessionId: string) {
    const carritoInvitado = await prisma.ord_carritos.findFirst({
      where: { session_id: sessionId },
      include: { items: true },
    });
    
    if (!carritoInvitado) return null;
    
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
    
    // Tipar explícitamente los items
    for (const item of carritoInvitado.items) {
      const existingItem = carritoUsuario.items.find(
        (i: { producto_id: number; variante_id: number | null }) => 
          i.producto_id === item.producto_id && i.variante_id === item.variante_id
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
    
    await prisma.ord_carritos.delete({
      where: { id: carritoInvitado.id },
    });
    
    return this.getCarrito(carritoUsuario.id);
  }
}