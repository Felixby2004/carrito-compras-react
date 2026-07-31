const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Ejecutando tarea: Crear iPhone 17 Pro Max, generar orden y ajustar fecha...');

  // 1. Obtener producto iPhone 17 Pro Max
  const sku = 'APL-IP17PM-256SLV';
  let producto = await prisma.cat_productos.findUnique({
    where: { sku }
  });

  const imagenUrl = 'https://res.cloudinary.com/pzk6vh2k/image/upload/v1785457438/silver-hero-zoom_enqjs1.webp';

  if (producto) {
    await prisma.cat_productos.update({
      where: { id: producto.id },
      data: {
        imagen_principal_url: imagenUrl,
      }
    }).catch(() => null);

    await prisma.cat_imagenes_producto.updateMany({
      where: { producto_id: producto.id },
      data: { url: imagenUrl, imagen_url: imagenUrl }
    }).catch(() => null);
  }

  if (!producto) {
    let marca = await prisma.cat_marcas.findFirst({ where: { nombre: { equals: 'Apple', mode: 'insensitive' } } });
    if (!marca) marca = await prisma.cat_marcas.create({ data: { nombre: 'Apple', descripcion: 'Apple Inc.' } });

    let categoria = await prisma.cat_categorias.findFirst({ where: { nombre: { equals: 'Electrónicos', mode: 'insensitive' } } });
    if (!categoria) categoria = await prisma.cat_categorias.create({ data: { nombre: 'Electrónicos', slug: 'electronicos' } });

    let subcategoria = await prisma.cat_subcategorias.findFirst({ where: { nombre: { equals: 'Teléfonos', mode: 'insensitive' } } });
    if (!subcategoria) subcategoria = await prisma.cat_subcategorias.create({ data: { nombre: 'Teléfonos', slug: 'telefonos', categoria_id: categoria.id } });

    let unidad = await prisma.cat_unidades_medida.findFirst();
    if (!unidad) unidad = await prisma.cat_unidades_medida.create({ data: { nombre: 'Unidad', simbolo: 'UND' } });

    producto = await prisma.cat_productos.create({
      data: {
        sku: sku,
        nombre: 'iPhone 17 Pro Max',
        descripcion_corta: 'iPhone 17 Pro Max 256GB Silver - Titanio y A19 Pro',
        descripcion_larga: 'iPhone 17 Pro Max 256GB Silver. Pantalla Super Retina XDR OLED de 6.9 pulgadas, Chip A19 Pro, Titanio de grado aeroespacial y sistema de cámaras de nivel profesional.',
        categoria_id: categoria.id,
        subcategoria_id: subcategoria.id,
        marca_id: marca.id,
        unidad_medida_id: unidad.id,
        precio_costo: 4200.00,
        precio_venta: 5499.00,
        peso: 0.221,
        estado: 'activo',
        activo: true,
        imagenes: {
          create: [{ url: imagenUrl, es_principal: true, orden: 0 }]
        },
        stock: {
          create: { stock_fisico: 25, stock_reservado: 0, stock_minimo: 5 }
        }
      }
    });
    console.log(`✅ Producto creado: ${producto.nombre} (ID: ${producto.id}, SKU: ${producto.sku})`);
  } else {
    console.log(`ℹ️ El producto ya existe: ${producto.nombre} (ID: ${producto.id}, SKU: ${producto.sku})`);
  }

  // 2. Buscar el usuario cliente1@nextouch.com o cliente1@ecommerce.com
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

  // Buscar o crear perfil de cliente
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

  // 3. Crear la orden de compra con fecha ajustada al 22 de Junio de 2026
  const ordenNumero = `ORD-${Date.now()}`;
  const subtotal = 5499.00;
  const impuesto = Number((subtotal * 0.18).toFixed(2));
  const costoEnvio = 0.00;
  const total = Number((subtotal + impuesto + costoEnvio).toFixed(2));
  const fechaDeseada = new Date('2026-06-22T10:00:00.000Z');

  const orden = await prisma.ord_ordenes.create({
    data: {
      orden_numero: ordenNumero,
      cliente_id: cliente.id,
      fecha_orden: fechaDeseada,
      created_at: fechaDeseada,
      updated_at: fechaDeseada,
      subtotal: subtotal,
      impuesto: impuesto,
      descuento: 0,
      costo_envio: costoEnvio,
      total: total,
      estado: 'pagada',
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
          direccion_completa: 'Av. Javier Prado Este 1234, Dpto 501, San Isidro',
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
            estado_nuevo: 'pagada',
            comentario: 'Pago procesado correctamente',
            fecha_cambio: new Date('2026-06-22T10:05:00.000Z'),
            usuario_id: usuario.id
          }
        ]
      }
    },
    include: {
      items: true
    }
  });

  console.log(`====================================================`);
  console.log(`✅ ORDEN CREADA Y FECHA AJUSTADA EXITOSAMENTE:`);
  console.log(`   - Producto: ${producto.nombre} (ID: ${producto.id})`);
  console.log(`   - SKU: ${producto.sku}`);
  console.log(`   - Imagen URL: ${imagenUrl}`);
  console.log(`   - Email cliente: ${usuario.email}`);
  console.log(`   - ID de la Orden: ${orden.id}`);
  console.log(`   - Número de Orden: ${orden.orden_numero}`);
  console.log(`   - Estado de la Orden: ${orden.estado}`);
  console.log(`   - Total pagado: S/ ${orden.total}`);
  console.log(`   - Fecha de Orden asignada: 2026-06-22 (22 de Junio de 2026)`);
  console.log(`====================================================`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Error en ejecucion:', err);
  prisma.$disconnect();
  process.exit(1);
});
