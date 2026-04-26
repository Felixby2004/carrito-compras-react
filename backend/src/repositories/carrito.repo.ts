import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CarritoRepository {
  
  async findOrCreateCarrito(usuarioId: number | null, sessionId: string | null) {
    console.log('=== findOrCreateCarrito ===');
    console.log('usuarioId:', usuarioId);
    console.log('sessionId:', sessionId);
    
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
      console.log('Carrito encontrado por usuarioId:', carrito?.id);
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
      console.log('Carrito encontrado por sessionId:', carrito?.id);
    }
    
    if (!carrito) {
      console.log('Creando nuevo carrito con sessionId:', sessionId);
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
      console.log('Nuevo carrito creado:', carrito.id);
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
    console.log('=== addItem EN REPOSITORIO ===');
    console.log('Buscando item existente con:', { carritoId, productoId, varianteId });
    
    const existingItem = await prisma.ord_items_carrito.findFirst({
      where: {
        carrito_id: carritoId,
        producto_id: productoId,
        variante_id: varianteId || null,
      },
    });
    
    console.log('Item existente encontrado:', existingItem);
    
    if (existingItem) {
      const nuevaCantidad = existingItem.cantidad + cantidad;
      console.log(`Actualizando cantidad: ${existingItem.cantidad} + ${cantidad} = ${nuevaCantidad}`);
      
      const updated = await prisma.ord_items_carrito.update({
        where: { id: existingItem.id },
        data: { cantidad: nuevaCantidad },
      });
      console.log('Item actualizado:', updated);
      return updated;
    }
    
    console.log('Creando nuevo item');
    const newItem = await prisma.ord_items_carrito.create({
      data: {
        carrito_id: carritoId,
        producto_id: productoId,
        variante_id: varianteId,
        cantidad,
        precio_unitario: precio,
      },
    });
    console.log('Nuevo item creado:', newItem);
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