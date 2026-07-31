const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const CLOUDINARY_URL = 'https://res.cloudinary.com/pzk6vh2k/image/upload/v1785457438/silver-hero-zoom_enqjs1.webp';

  const productos = await prisma.cat_productos.findMany({
    where: {
      OR: [
        { sku: { contains: 'IP17PM' } },
        { nombre: { contains: 'iPhone 17', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Encontrados ${productos.length} productos iPhone 17.`);

  for (const p of productos) {
    // Actualizar o crear imágenes en cat_imagenes_producto
    const imagenesExistentes = await prisma.cat_imagenes_producto.findMany({
      where: { producto_id: p.id }
    });

    if (imagenesExistentes.length > 0) {
      await prisma.cat_imagenes_producto.updateMany({
        where: { producto_id: p.id },
        data: { url: CLOUDINARY_URL }
      });
    } else {
      await prisma.cat_imagenes_producto.create({
        data: {
          producto_id: p.id,
          url: CLOUDINARY_URL,
          es_principal: true,
          orden: 1
        }
      });
    }
    console.log(`✅ Imagen actualizada para producto ID ${p.id} (${p.nombre})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

