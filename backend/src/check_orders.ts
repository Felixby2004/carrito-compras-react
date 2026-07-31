import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ordenes = await prisma.ord_ordenes.findMany({
    include: {
      cliente: {
        include: {
          usuario: true
        }
      },
      items: true
    },
    orderBy: { created_at: 'desc' }
  });

  console.log(`Encontradas ${ordenes.length} órdenes en la base de datos:\n`);
  for (const o of ordenes) {
    console.log(`📦 Orden ID: ${o.id} | Número: ${o.orden_numero}`);
    console.log(`   Cliente Email: ${o.cliente?.usuario?.email}`);
    console.log(`   Estado: ${o.estado} | Total: S/ ${o.total}`);
    console.log(`   Fecha Orden: ${o.fecha_orden.toISOString()}`);
    console.log(`   Ítems: ${o.items.map(i => `${i.nombre_producto} (x${i.cantidad})`).join(', ')}\n`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
