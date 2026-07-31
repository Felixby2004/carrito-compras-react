import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando script para crear iPhone 17 Pro Max, generar orden y ajustar fecha...');

  // 1. Obtener o crear Marca (Apple)
  let marca = await prisma.cat_marcas.findFirst({
    where: { nombre: { equals: 'Apple', mode: 'insensitive' } }
  });
  if (!marca) {
    marca = await prisma.cat_marcas.create({
      data: { nombre: 'Apple' }
    });
  }

  // 2. Obtener o crear Categoría (Teléfonos / Electrónicos)
  let categoria = await prisma.cat_categorias.findFirst({
    where: {
      OR: [
        { nombre: { equals: 'Teléfonos', mode: 'insensitive' } },
        { nombre: { equals: 'Smartphones', mode: 'insensitive' } },
        { nombre: { equals: 'Electrónicos', mode: 'insensitive' } },
      ]
    }
  });
  if (!categoria) {
    categoria = await prisma.cat_categorias.findFirst() || await prisma.cat_categorias.create({
      data: { nombre: 'Electrónicos', slug: 'electronicos', descripcion: 'Dispositivos electrónicos' }
    });
  }

  let unidad = await prisma.cat_unidades_medida.findFirst();
  if (!unidad) {
    unidad = await prisma.cat_unidades_medida.create({
      data: { nombre: 'Unidad', abreviatura: 'UND' }
    });
  }

  // 3. Crear el producto iPhone 17 Pro Max
  const sku = 'APL-IP17PM-256SLV';
  let producto = await prisma.cat_productos.findUnique({
    where: { sku }
  });

  const imagenUrl = 'https://res.cloudinary.com/pzk6vh2k/image/upload/v1785457438/silver-hero-zoom_enqjs1.webp';

  if (!producto) {
    producto = await prisma.cat_productos.create({
      data: {
        categoria_id: categoria.id,
        marca_id: marca.id,
        unidad_medida_id: unidad.id,
        sku: sku,
        nombre: 'iPhone 17 Pro Max',
        descripcion_corta: 'iPhone 17 Pro Max 256GB Silver - Titanio y A19 Pro',
        descripcion_larga: 'iPhone 17 Pro Max 256GB Silver - Pantalla Super Retina XDR OLED 6.9", Chip A19 Pro, Titanio de grado aeroespacial.',
        precio_costo: 4200.00,
        precio_venta: 5499.00,
        estado: 'activo',
        imagenes: {
          create: [
            { url: imagenUrl, es_principal: true, orden: 1 }
          ]
        },
        stock: {
          create: {
            stock_fisico: 25,
            stock_reservado: 0,
            stock_minimo: 3,
            ubicacion_almacen: 'A-17-MAX'
          }
        }
      }
    });
    console.log(`✅ Producto creado: ${producto.nombre} (ID: ${producto.id}, SKU: ${producto.sku})`);
  } else {
    console.log(`ℹ️ El producto ya existía: ${producto.nombre} (ID: ${producto.id})`);
  }

  // 4. Buscar el usuario cliente1@nextouch.com o cliente1@ecommerce.com
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

  // 5. Crear la orden de compra
  const ordenNumero = `ORD-${Date.now()}`;
  const subtotal = 5499.00;
  const impuesto = Number((subtotal * 0.18).toFixed(2));
  const costoEnvio = 0.00;
  const total = Number((subtotal + impuesto + costoEnvio).toFixed(2));

  const orden = await prisma.ord_ordenes.create({
    data: {
      orden_numero: ordenNumero,
      cliente_id: cliente.id,
      fecha_orden: new Date('2026-06-22T10:00:00.000Z'),
      created_at: new Date('2026-06-22T10:00:00.000Z'),
      updated_at: new Date('2026-06-22T10:00:00.000Z'),
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

  console.log(`✅ Orden creada exitosamente:`);
  console.log(`   - ID: ${orden.id}`);
  console.log(`   - Número: ${orden.orden_numero}`);
  console.log(`   - Cliente Email: ${usuario.email}`);
  console.log(`   - Estado: ${orden.estado}`);
  console.log(`   - Total: S/ ${orden.total}`);
  console.log(`   - Fecha ajustada a: ${orden.fecha_orden.toISOString()} (22/06/2026)`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Error en script:', err);
  prisma.$disconnect();
  process.exit(1);
});
