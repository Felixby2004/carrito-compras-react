import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Ejecutando script de creación de producto iPhone 17 Pro Max, orden y fecha...');

  // 1. Obtener o crear Marca (Apple)
  let marca = await prisma.cat_marcas.findFirst({
    where: { nombre: { equals: 'Apple', mode: 'insensitive' } }
  });
  if (!marca) {
    marca = await prisma.cat_marcas.create({
      data: { nombre: 'Apple', logo_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300' }
    });
  }

  // 2. Obtener o crear Categoría (Electrónicos) y Subcategoría (Teléfonos)
  let categoria = await prisma.cat_categorias.findFirst({
    where: { nombre: { equals: 'Electrónicos', mode: 'insensitive' } }
  });
  if (!categoria) {
    categoria = await prisma.cat_categorias.create({
      data: { nombre: 'Electrónicos', slug: 'electronicos' }
    });
  }

  let subcategoria = await prisma.cat_subcategorias.findFirst({
    where: { nombre: { equals: 'Teléfonos', mode: 'insensitive' } }
  });
  if (!subcategoria) {
    subcategoria = await prisma.cat_subcategorias.create({
      data: { categoria_id: categoria.id, nombre: 'Teléfonos', slug: 'telefonos' }
    });
  }

  let unidadMedida = await prisma.cat_unidades_medida.findFirst({
    where: { abreviatura: 'UND' }
  });
  if (!unidadMedida) {
    unidadMedida = await prisma.cat_unidades_medida.findFirst() || await prisma.cat_unidades_medida.create({
      data: { nombre: 'Unidad', abreviatura: 'UND' }
    });
  }

  // 3. Crear o verificar el producto iPhone 17 Pro Max
  const sku = 'APL-IP17PM-256SLV';
  const imagenUrl = 'https://res.cloudinary.com/pzk6vh2k/image/upload/v1785457438/silver-hero-zoom_enqjs1.webp';

  let producto = await prisma.cat_productos.findUnique({
    where: { sku },
    include: { imagenes: true, stock: true }
  });

  if (!producto) {
    producto = await prisma.cat_productos.create({
      data: {
        sku: sku,
        nombre: 'iPhone 17 Pro Max',
        descripcion_corta: 'iPhone 17 Pro Max 256GB Silver - Titanio de grado aeroespacial y Chip A19 Pro',
        descripcion_larga: 'iPhone 17 Pro Max 256GB en acabado Silver (Plateado). Pantalla Super Retina XDR OLED de 6.9 pulgadas, Chip A19 Pro, cámara principal con sensor avanzado.',
        categoria_id: categoria.id,
        subcategoria_id: subcategoria.id,
        marca_id: marca.id,
        unidad_medida_id: unidadMedida.id,
        precio_costo: 4200.00,
        precio_venta: 5499.00,
        peso: 0.221,
        estado: 'activo',
        activo: true,
        imagenes: {
          create: [
            { url: imagenUrl, es_principal: true, orden: 1 }
          ]
        },
        stock: {
          create: {
            stock_fisico: 25,
            stock_reservado: 0,
            stock_minimo: 5,
            ubicacion_almacen: 'A-17-MAX'
          }
        }
      },
      include: { imagenes: true, stock: true }
    });
    console.log(`✅ Producto creado: ${producto.nombre} (ID: ${producto.id}, SKU: ${producto.sku})`);
  } else {
    console.log(`ℹ️ El producto ya existe: ${producto.nombre} (ID: ${producto.id}, SKU: ${producto.sku})`);
    
    // Asegurar que la imagen está bien asignada en cat_imagenes_producto
    if (producto.imagenes.length === 0) {
      await prisma.cat_imagenes_producto.create({
        data: { producto_id: producto.id, url: imagenUrl, es_principal: true, orden: 1 }
      });
    } else {
      await prisma.cat_imagenes_producto.updateMany({
        where: { producto_id: producto.id },
        data: { url: imagenUrl }
      });
    }
  }

  // 4. Buscar usuario cliente1@nextouch.com
  const usuario = await prisma.seg_usuarios.findFirst({
    where: {
      OR: [
        { email: 'cliente1@nextouch.com' },
        { email: 'cliente1@ecommerce.com' }
      ]
    }
  });

  if (!usuario) {
    throw new Error('No se encontró el usuario cliente1@nextouch.com');
  }

  let cliente = await prisma.cli_clientes.findUnique({
    where: { usuario_id: usuario.id }
  });

  if (!cliente) {
    cliente = await prisma.cli_clientes.create({
      data: {
        usuario_id: usuario.id,
        telefono: '999888777',
        segmento: 'vip'
      }
    });
  }

  // 5. Crear la orden de compra
  const targetDate = new Date('2026-06-22T10:00:00.000Z');
  const ordenNumero = `ORD-${Date.now().toString().slice(-12)}`;
  const subtotal = 5499.00;
  const impuesto = Number((subtotal * 0.18).toFixed(2));
  const costoEnvio = 0.00;
  const total = Number((subtotal + impuesto + costoEnvio).toFixed(2));

  const orden = await prisma.ord_ordenes.create({
    data: {
      orden_numero: ordenNumero,
      cliente_id: cliente.id,
      fecha_orden: targetDate,
      created_at: targetDate,
      updated_at: targetDate,
      subtotal: subtotal,
      impuesto: impuesto,
      descuento: 0,
      costo_envio: costoEnvio,
      total: total,
      estado: 'completado',
      metodo_pago: 'tarjeta_credito',
      created_by: usuario.id,
      items: {
        create: [
          {
            producto_id: producto.id,
            nombre_producto: producto.nombre,
            cantidad: 1,
            precio_unitario: 5499.00,
            subtotal: 5499.00
          }
        ]
      },
      direccion_envio: {
        create: {
          cliente_id: cliente.id,
          destinatario: 'Cliente Uno',
          direccion_completa: 'Av. Javier Prado Este 1234, Dpto 501',
          departamento: 'Lima',
          ciudad: 'Lima',
          codigo_postal: '15036',
          telefono: '999888777'
        }
      },
      historial_estados: {
        create: [
          {
            estado_anterior: 'pendiente_pago',
            estado_nuevo: 'completado',
            comentario: 'Orden confirmada y pagada exitosamente',
            fecha_cambio: targetDate,
            usuario_id: usuario.id
          }
        ]
      }
    },
    include: {
      items: true,
      direccion_envio: true
    }
  });

  console.log('\n================ RESULTADOS ================');
  console.log(`✅ Producto: ${producto.nombre} (ID: ${producto.id}, SKU: ${producto.sku})`);
  console.log(`   Imagen URL: ${imagenUrl}`);
  console.log(`✅ Cliente: ${usuario.email} (Cliente ID: ${cliente.id})`);
  console.log(`✅ Orden Creada:`);
  console.log(`   - ID de Orden: ${orden.id}`);
  console.log(`   - Número de Orden: ${orden.orden_numero}`);
  console.log(`   - Estado: ${orden.estado}`);
  console.log(`   - Total: S/ ${orden.total}`);
  console.log(`   - Fecha Ajustada: ${orden.fecha_orden.toISOString()} (22 de Junio de 2026)`);
  console.log('============================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Error en script:', err);
  prisma.$disconnect();
  process.exit(1);
});
