const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetDate = new Date('2026-06-22T10:00:00.000Z');
  
  // Find the order for cliente1@nextouch.com with iPhone 17 Pro Max
  const order = await prisma.ord_ordenes.findFirst({
    where: {
      cliente: {
        usuario: {
          email: 'cliente1@nextouch.com'
        }
      },
      items: {
        some: {
          producto: {
            nombre: { contains: 'iPhone 17 Pro Max', mode: 'insensitive' }
          }
        }
      }
    },
    include: {
      items: true,
      cliente: { include: { usuario: true } }
    }
  });

  if (!order) {
    console.error('❌ No se encontró el pedido para cliente1@nextouch.com con iPhone 17 Pro Max');
    return;
  }

  console.log(`📦 Encontrado pedido ID: ${order.id}, Número: ${order.orden_numero}`);

  const updatedOrder = await prisma.ord_ordenes.update({
    where: { id: order.id },
    data: {
      fecha_orden: targetDate,
      created_at: targetDate,
      updated_at: targetDate
    }
  });

  console.log('✅ Fecha de orden actualizada exitosamente en ord_ordenes:');
  console.log({
    id: updatedOrder.id,
    orden_numero: updatedOrder.orden_numero,
    fecha_orden: updatedOrder.fecha_orden,
    created_at: updatedOrder.created_at,
    updated_at: updatedOrder.updated_at
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
