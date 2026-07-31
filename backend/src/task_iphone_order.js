const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Ejecutando tarea: Crear iPhone 17 Pro Max, generar orden y ajustar fecha...');

  // 1. Obtener o crear Marca (Apple)
  let marca = await prisma.cat_marcas.findFirst({
    where: { nombre: { equals: 'Apple', mode: 'insensitive' } }
  });
  if (!marca) {
    marca = await prisma.cat_marcas.create({
      data: { nombre: 'Apple', descripcion: 'Apple Inc.' }
    });
  }

  // 2. Obtener o crear Categoría
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
    categoria = await prisma.cat_categorias.findFirst();
    if (!categoria) {
      categoria = await prisma.cat_categorias.create({
        data: { nombre: 'Electrónicos', descripcion: 'Dispositivos electrónicos' }
      });
    }
  }

  // 3. Crear el producto iPhone 17 Pro Max
  const sku = 'APL-IP17PM-256SLV';
  let producto = await prisma.cat_productos.findUnique({
    where: { sku }
  });

  const imagenUrl = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800';

  if (!producto) {
    producto = await prisma.cat_productos.create({
      data: {
        categoria_id: categoria.id,
        marca_id: marca.id,
        sku: sku,
        nombre: 'iPhone 17 Pro Max',
        descripcion: 'iPhone 17 Pro Max 256GB Silver - Pantalla Super Retina XDR OLED 6.9", Chip A19 Pro, Titanio de grado aeroespacial.',
        precio_base: 5499.00,
        porcentaje_descuento: 0,
        precio_final: 5499.00,
        estado: 'activo',
        imagen_principal_url: imagenUrl,
        imagenes: {
          create: [
            { imagen_url: imagenUrl, es_principal: true, orden: 1 }
          ]
        },
        stock: {
          create: {
            stock_actual: 25,
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
            sku_producto: producto.sku,
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
          provincia: 'Lima',
          distrito: 'San Isidro',
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
  console.log(`   - Imagen URL: ${producto.imagen_principal_url}`);
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
