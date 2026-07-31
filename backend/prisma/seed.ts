import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // 1. Limpiar datos existentes en el orden correcto (respetando dependencias)
  console.log('📝 Limpiando datos existentes...');
  
  // Primero: tablas sin dependencias externas o que dependen de otras
  await prisma.ord_historial_estados.deleteMany({});
  await prisma.ord_items_carrito.deleteMany({});
  await prisma.ord_carritos.deleteMany({});
  await prisma.ord_items_orden.deleteMany({});
  await prisma.ord_direcciones_envio.deleteMany({});
  await prisma.ord_pagos.deleteMany({});
  await prisma.ord_ordenes.deleteMany({});
  await prisma.cli_resenas_producto.deleteMany({});
  await prisma.cli_items_lista_deseos.deleteMany({});
  await prisma.cli_lista_deseos.deleteMany({});
  await prisma.cli_historial_navegacion.deleteMany({});
  await prisma.cli_direcciones.deleteMany({});
  await prisma.cli_clientes.deleteMany({});
  await prisma.inv_stock_producto.deleteMany({});
  // Órdenes de compra / recepciones (referencian productos y proveedores)
  await prisma.inv_recepciones.deleteMany({});
  await prisma.inv_detalle_orden_compra.deleteMany({});
  await prisma.inv_ordenes_compra.deleteMany({});
  await prisma.inv_proveedores.deleteMany({});
  await prisma.cat_imagenes_producto.deleteMany({});
  await prisma.cat_productos.deleteMany({});
  await prisma.cat_subcategorias.deleteMany({});
  await prisma.cat_categorias.deleteMany({});
  await prisma.cat_marcas.deleteMany({});
  await prisma.cat_unidades_medida.deleteMany({});
  await prisma.ord_cupones.deleteMany({});
  await prisma.ord_metodos_envio.deleteMany({});
  await prisma.configuracion_sistema.deleteMany({});
  await prisma.seg_refresh_tokens.deleteMany({});
  await prisma.seg_usuario_rol.deleteMany({});
  await prisma.seg_roles.deleteMany({});
  await prisma.seg_usuarios.deleteMany({});

  console.log('✅ Limpieza completada');

  // 2. Crear roles
  const roles = await createRoles();
  
  // 3. Crear usuario administrador
  const adminUser = await createAdminUser();
  
  // 4. Asignar rol administrador
  await assignRoleToUser(adminUser.id, roles.administrador.id);

  // 5. Crear usuarios demo por rol (para pruebas del panel)
  await createDemoUsers(roles);
  
  // 6. Crear unidades de medida
  const unidades = await createUnidadesMedida();
  
  // 7. Crear categorías
  const categorias = await createCategorias();
  
  // 8. Crear marcas
  const marcas = await createMarcas();

  // 9. Crear métodos de envío
  await createMetodosEnvio();
  
  // 10. Crear productos
  await createProductos(categorias, marcas, unidades);

  // 11. Crear configuración del sistema
  await createConfiguracion();

  await createResenas();
  
  console.log('✅ Seed completado exitosamente');
}

async function createRoles() {
  console.log('📝 Creando roles...');
  
  const rolesData = [
    { nombre: 'administrador', descripcion: 'Acceso total al sistema' },
    { nombre: 'gerente_ventas', descripcion: 'Gestión de ventas y reportes' },
    { nombre: 'gerente_inventario', descripcion: 'Gestión de productos e inventario' },
    { nombre: 'vendedor', descripcion: 'Atención al cliente y procesamiento de órdenes' },
    { nombre: 'cliente', descripcion: 'Cliente registrado' },
  ];
  
  const roles: Record<string, any> = {};
  
  for (const roleData of rolesData) {
    const role = await prisma.seg_roles.create({
      data: roleData,
    });
    roles[roleData.nombre] = role;
    console.log(`  - Rol creado: ${role.nombre}`);
  }
  
  return roles;
}

async function createAdminUser() {
  console.log('📝 Creando usuarios administradores...');
  
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  const adminEmails = ['admin@nextouch.com', 'admin@ecommerce.com'];
  let firstAdmin = null;

  for (const email of adminEmails) {
    const adminUser = await prisma.seg_usuarios.create({
      data: {
        email,
        password_hash: hashedPassword,
        email_verificado: true,
        activo: true,
      },
    });
    
    console.log(`  - Usuario admin creado: ${email} / Admin123!`);
    
    await prisma.cli_clientes.create({
      data: {
        usuario_id: adminUser.id,
        telefono: '999999999',
        total_gastado: 0,
        segmento: 'vip',
      },
    });
    
    if (!firstAdmin) firstAdmin = adminUser;
  }
  
  return firstAdmin!;
}

async function assignRoleToUser(usuarioId: number, rolId: number) {
  await prisma.seg_usuario_rol.create({
    data: { usuario_id: usuarioId, rol_id: rolId },
  });
  console.log(`  - Rol asignado a usuario ${usuarioId}`);
}

async function createDemoUsers(roles: any) {
  console.log('📝 Creando usuarios demo por rol...');

  const demo = [
    { email: 'ventas@nextouch.com', password: 'Ventas123!', rol: 'gerente_ventas', segmento: 'vip' },
    { email: 'inventario@nextouch.com', password: 'Inventario123!', rol: 'gerente_inventario', segmento: 'nuevo' },
    { email: 'vendedor@nextouch.com', password: 'Vendedor123!', rol: 'vendedor', segmento: 'recurrente' },
    { email: 'cliente1@nextouch.com', password: 'Cliente123!', rol: 'cliente', segmento: 'nuevo' },
    { email: 'ventas@ecommerce.com', password: 'Ventas123!', rol: 'gerente_ventas', segmento: 'vip' },
    { email: 'inventario@ecommerce.com', password: 'Inventario123!', rol: 'gerente_inventario', segmento: 'nuevo' },
    { email: 'vendedor@ecommerce.com', password: 'Vendedor123!', rol: 'vendedor', segmento: 'recurrente' },
    { email: 'cliente1@ecommerce.com', password: 'Cliente123!', rol: 'cliente', segmento: 'nuevo' },
  ];

  for (const u of demo) {
    const hashed = await bcrypt.hash(u.password, 12);
    const user = await prisma.seg_usuarios.create({
      data: {
        email: u.email,
        password_hash: hashed,
        email_verificado: true,
        activo: true,
      },
    });
    await prisma.cli_clientes.create({
      data: {
        usuario_id: user.id,
        telefono: '999999999',
        total_gastado: 0,
        segmento: u.segmento,
      },
    });
    const rol = roles[u.rol];
    if (rol) {
      await assignRoleToUser(user.id, rol.id);
    }
    console.log(`  - Demo: ${u.email} / ${u.password} (${u.rol})`);
  }
}

async function createUnidadesMedida() {
  console.log('📝 Creando unidades de medida...');
  
  const unidadesData = [
    { nombre: 'Unidad', abreviatura: 'und' },
    { nombre: 'Kilogramo', abreviatura: 'kg' },
    { nombre: 'Litro', abreviatura: 'L' },
    { nombre: 'Metro', abreviatura: 'm' },
    { nombre: 'Par', abreviatura: 'par' },
  ];
  
  const unidades: Record<string, any> = {};
  
  for (const uniData of unidadesData) {
    const unidad = await prisma.cat_unidades_medida.create({
      data: uniData,
    });
    unidades[uniData.nombre] = unidad;
    console.log(`  - Unidad creada: ${unidad.nombre}`);
  }
  
  return unidades;
}

async function createCategorias() {
  console.log('📝 Creando categorías...');
  
  const categoriasData = [
    { nombre: 'Electrónicos', slug: 'electronicos' },
    { nombre: 'Ropa y Accesorios', slug: 'ropa-accesorios' },
    { nombre: 'Hogar y Cocina', slug: 'hogar-cocina' },
    { nombre: 'Deportes y Aire Libre', slug: 'deportes-aire-libre' },
    { nombre: 'Libros y Entretenimiento', slug: 'libros-entretenimiento' },
    { nombre: 'Salud y Belleza', slug: 'salud-belleza' },
  ];
  
  const categorias: Record<string, any> = {};
  
  for (const catData of categoriasData) {
    const categoria = await prisma.cat_categorias.create({
      data: catData,
    });
    categorias[catData.nombre] = categoria;
    console.log(`  - Categoría creada: ${categoria.nombre}`);
  }
  
  // Subcategorías
  const subcategoriasData = [
    { nombre: 'Teléfonos', slug: 'telefonos', categoria: 'Electrónicos' },
    { nombre: 'Laptops', slug: 'laptops', categoria: 'Electrónicos' },
    { nombre: 'Audífonos', slug: 'audifonos', categoria: 'Electrónicos' },
    { nombre: 'Tablets', slug: 'tablets', categoria: 'Electrónicos' },
    { nombre: 'TV y Video', slug: 'tv-video', categoria: 'Electrónicos' },
    { nombre: 'Consolas', slug: 'consolas', categoria: 'Electrónicos' },
    { nombre: 'Cámaras', slug: 'camaras', categoria: 'Electrónicos' },
    { nombre: 'Smartwatch', slug: 'smartwatch', categoria: 'Electrónicos' },
    { nombre: 'Camisetas', slug: 'camisetas', categoria: 'Ropa y Accesorios' },
    { nombre: 'Pantalones', slug: 'pantalones', categoria: 'Ropa y Accesorios' },
    { nombre: 'Zapatos', slug: 'zapatos', categoria: 'Ropa y Accesorios' },
    { nombre: 'Chaquetas', slug: 'chaquetas', categoria: 'Ropa y Accesorios' },
    { nombre: 'Accesorios', slug: 'accesorios', categoria: 'Ropa y Accesorios' },
    { nombre: 'Sartenes', slug: 'sartenes', categoria: 'Hogar y Cocina' },
    { nombre: 'Utensilios', slug: 'utensilios', categoria: 'Hogar y Cocina' },
    { nombre: 'Electrodomésticos', slug: 'electrodomesticos', categoria: 'Hogar y Cocina' },
    { nombre: 'Limpieza', slug: 'limpieza', categoria: 'Hogar y Cocina' },
    { nombre: 'Decoración', slug: 'decoracion', categoria: 'Hogar y Cocina' },
    { nombre: 'Fitness', slug: 'fitness', categoria: 'Deportes y Aire Libre' },
    { nombre: 'Camping', slug: 'camping', categoria: 'Deportes y Aire Libre' },
    { nombre: 'Ciclismo', slug: 'ciclismo', categoria: 'Deportes y Aire Libre' },
    { nombre: 'Novelas', slug: 'novelas', categoria: 'Libros y Entretenimiento' },
    { nombre: 'Cómics', slug: 'comics', categoria: 'Libros y Entretenimiento' },
    { nombre: 'Videojuegos', slug: 'videojuegos', categoria: 'Libros y Entretenimiento' },
    { nombre: 'Cuidado de la piel', slug: 'cuidado-piel', categoria: 'Salud y Belleza' },
    { nombre: 'Higiene', slug: 'higiene', categoria: 'Salud y Belleza' },
    { nombre: 'Suplementos', slug: 'suplementos', categoria: 'Salud y Belleza' },
  ];
  
  for (const subcatData of subcategoriasData) {
    const categoria = categorias[subcatData.categoria];
    if (categoria) {
      await prisma.cat_subcategorias.create({
        data: {
          nombre: subcatData.nombre,
          slug: subcatData.slug,
          categoria_id: categoria.id,
        },
      });
      console.log(`  - Subcategoría creada: ${subcatData.nombre}`);
    }
  }
  
  return categorias;
}

async function createMarcas() {
  console.log('📝 Creando marcas...');
  
  const marcasData = [
    'Samsung', 'Apple', 'Sony', 'Nike', 'Adidas', 'LG', 'HP', 'Dell', 'Bosch',
    'Lenovo', 'ASUS', 'Acer', 'Microsoft', 'Xiaomi', 'Huawei', 'JBL', 'Bose',
    'Canon', 'Nikon', 'GoPro', 'Philips', 'Panasonic', 'KitchenAid', 'Dyson',
    'Under Armour', 'Puma', 'New Balance', 'Reebok', 'Columbia',
    'PlayStation', 'Nintendo', 'Xbox', 'LEGO', 'Hasbro',
    "L'Oréal", 'Maybelline', 'Nivea', 'Gillette', 'Oral-B',
    'Penguin', 'Planeta', 'Marvel', 'DC',
  ];
  
  const marcas: Record<string, any> = {};
  
  for (const nombre of marcasData) {
    const marca = await prisma.cat_marcas.create({
      data: { nombre },
    });
    marcas[nombre] = marca;
    console.log(`  - Marca creada: ${marca.nombre}`);
  }
  
  return marcas;
}

async function createMetodosEnvio() {
  console.log('📝 Creando métodos de envío...');
  
  const metodosData = [
    { nombre: 'Estándar', costo: 10.00, tiempo_estimado: '3-5 días hábiles' },
    { nombre: 'Express', costo: 25.00, tiempo_estimado: '1-2 días hábiles' },
    { nombre: 'Gratis', costo: 0, tiempo_estimado: '5-7 días hábiles' },
  ];
  
  for (const metodoData of metodosData) {
    await prisma.ord_metodos_envio.create({
      data: metodoData,
    });
    console.log(`  - Método de envío creado: ${metodoData.nombre}`);
  }
}

async function createProductos(categorias: any, marcas: any, unidades: any) {
  console.log('📝 Creando productos de ejemplo...');
  
  const productosData = [
    {
      sku: 'SAM-S23-001',
      nombre: 'Samsung Galaxy S23',
      descripcion_corta: 'Smartphone de última generación con cámara de 50MP',
      categoria: 'Electrónicos',
      subcategoria: 'Teléfonos',
      marca: 'Samsung',
      precio_costo: 2500.00,
      precio_venta: 3299.00,
      peso: 0.168,
      stock: 50,
      stock_minimo: 10,
      imagen_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    },
    {
      sku: 'APL-IP14-002',
      nombre: 'iPhone 14',
      descripcion_corta: 'iPhone 14 con chip A15 Bionic',
      categoria: 'Electrónicos',
      subcategoria: 'Teléfonos',
      marca: 'Apple',
      precio_costo: 3000.00,
      precio_venta: 3899.00,
      peso: 0.172,
      stock: 30,
      stock_minimo: 8,
      imagen_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    },
    {
      sku: 'APL-IP17PM-256SLV',
      nombre: 'iPhone 17 Pro Max',
      descripcion_corta: 'iPhone 17 Pro Max 256GB Silver - Titanio y A19 Pro',
      categoria: 'Electrónicos',
      subcategoria: 'Teléfonos',
      marca: 'Apple',
      precio_costo: 4200.00,
      precio_venta: 5499.00,
      peso: 0.221,
      stock: 25,
      stock_minimo: 5,
      imagen_url: 'https://res.cloudinary.com/pzk6vh2k/image/upload/v1785457438/silver-hero-zoom_enqjs1.webp',
    },
    {
      sku: 'NKE-AIR-003',
      nombre: 'Nike Air Max',
      descripcion_corta: 'Zapatillas deportivas con tecnología Air Max',
      categoria: 'Ropa y Accesorios',
      subcategoria: 'Zapatos',
      marca: 'Nike',
      precio_costo: 180.00,
      precio_venta: 299.00,
      precio_oferta: 249.00,
      fecha_inicio_oferta: new Date(),
      fecha_fin_oferta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      peso: 0.8,
      stock: 100,
      stock_minimo: 20,
      imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    },
    {
      sku: 'ADDS-RUN-004',
      nombre: 'Adidas Running Shoes',
      descripcion_corta: 'Zapatillas para running con amortiguación Boost',
      categoria: 'Ropa y Accesorios',
      subcategoria: 'Zapatos',
      marca: 'Adidas',
      precio_costo: 150.00,
      precio_venta: 259.00,
      peso: 0.75,
      stock: 80,
      stock_minimo: 15,
      imagen_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
    },
    {
      sku: 'SON-HD-005',
      nombre: 'Sony WH-1000XM5',
      descripcion_corta: 'Audífonos con cancelación de ruido',
      categoria: 'Electrónicos',
      subcategoria: 'Audífonos',
      marca: 'Sony',
      precio_costo: 280.00,
      precio_venta: 449.00,
      precio_oferta: 399.00,
      fecha_inicio_oferta: new Date(),
      fecha_fin_oferta: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      peso: 0.25,
      stock: 45,
      stock_minimo: 10,
      imagen_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    },
  ];
  
  const unidadDefault = unidades['Unidad'];
  
  for (const prodData of productosData) {
    const categoria = categorias[prodData.categoria];
    const subcategoria = await prisma.cat_subcategorias.findFirst({ 
      where: { nombre: prodData.subcategoria } 
    });
    const marca = prodData.marca ? marcas[prodData.marca] : undefined;
    
    if (!categoria || !unidadDefault) continue;
    
    const producto = await prisma.cat_productos.create({
      data: {
        sku: prodData.sku,
        nombre: prodData.nombre,
        descripcion_corta: prodData.descripcion_corta,
        categoria_id: categoria.id,
        subcategoria_id: subcategoria?.id,
        marca_id: marca?.id,
        unidad_medida_id: unidadDefault.id,
        precio_costo: prodData.precio_costo,
        precio_venta: prodData.precio_venta,
        precio_oferta: prodData.precio_oferta,
        fecha_inicio_oferta: prodData.fecha_inicio_oferta,
        fecha_fin_oferta: prodData.fecha_fin_oferta,
        peso: prodData.peso,
        estado: 'activo',
        activo: true,
        stock: {
          create: {
            stock_fisico: prodData.stock,
            stock_reservado: 0,
            stock_minimo: prodData.stock_minimo,
          },
        },
        imagenes: prodData.imagen_url ? {
          create: [
            {
              url: prodData.imagen_url,
              es_principal: true,
              orden: 0,
            },
          ],
        } : undefined,
      },
    });
    
    console.log(`  - Producto creado: ${producto.nombre}`);
  }
}

async function createResenas() {
  console.log('📝 Creando reseñas de ejemplo...');
  
  const clientes = await prisma.cli_clientes.findMany({ take: 2 });
  const productos = await prisma.cat_productos.findMany({ take: 5 });
  
  const reseñasData = [
    { cliente: 0, producto: 0, calificacion: 5, comentario: 'Excelente producto, muy recomendado!' },
    { cliente: 0, producto: 1, calificacion: 4, comentario: 'Muy bueno, cumple con lo esperado.' },
    { cliente: 1, producto: 0, calificacion: 5, comentario: 'Producto de calidad, llegó rápido.' },
    { cliente: 1, producto: 2, calificacion: 3, comentario: 'Bueno pero podría mejorar el empaque.' },
    { cliente: 0, producto: 3, calificacion: 5, comentario: 'Increíble, superó mis expectativas.' },
  ];
  
  for (const res of reseñasData) {
    if (clientes[res.cliente] && productos[res.producto]) {
      await prisma.cli_resenas_producto.create({
        data: {
          cliente_id: clientes[res.cliente].id,
          producto_id: productos[res.producto].id,
          calificacion: res.calificacion,
          comentario: res.comentario,
        },
      });
    }
  }
  
  console.log('  - Reseñas creadas');
}

async function createConfiguracion() {
  console.log('📝 Creando configuración del sistema...');
  
  const configData = [
    { clave: 'impuesto_porcentaje', valor: '18' },
    { clave: 'tiempo_reserva_stock_minutos', valor: '15' },
    { clave: 'tiempo_maximo_cancelacion_orden_horas', valor: '24' },
    { clave: 'envio_gratis_monto_minimo', valor: '200' },
  ];
  
  for (const confData of configData) {
    await prisma.configuracion_sistema.create({
      data: {
        ...confData,
        updated_at: new Date(),
      },
    });
    console.log(`  - Configuración creada: ${confData.clave} = ${confData.valor}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
