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
  await prisma.inv_movimientos_inventario.deleteMany({});
  await prisma.inv_stock_producto.deleteMany({});
  await prisma.cat_producto_etiqueta.deleteMany({});
  await prisma.cat_producto_atributo.deleteMany({});
  await prisma.cat_imagenes_producto.deleteMany({});
  await prisma.cat_productos.deleteMany({});
  await prisma.cat_subcategorias.deleteMany({});
  await prisma.cat_categorias.deleteMany({});
  await prisma.cat_marcas.deleteMany({});
  await prisma.cat_unidades_medida.deleteMany({});
  await prisma.cat_etiquetas.deleteMany({});
  await prisma.cat_atributos.deleteMany({});
  await prisma.cat_valores_atributo.deleteMany({});
  await prisma.ord_cupones.deleteMany({});
  await prisma.ord_metodos_envio.deleteMany({});
  await prisma.ord_estados_orden.deleteMany({});
  await prisma.inv_proveedores.deleteMany({});
  await prisma.inv_ordenes_compra.deleteMany({});
  await prisma.inv_detalle_orden_compra.deleteMany({});
  await prisma.inv_recepciones.deleteMany({});
  await prisma.monedas.deleteMany({});
  await prisma.tipo_cambio.deleteMany({});
  await prisma.configuracion_sistema.deleteMany({});
  await prisma.auditoria_registro.deleteMany({});
  await prisma.seg_refresh_tokens.deleteMany({});
  await prisma.seg_usuario_rol.deleteMany({});
  await prisma.seg_rol_permiso.deleteMany({});
  await prisma.seg_permisos.deleteMany({});
  await prisma.seg_roles.deleteMany({});
  await prisma.seg_usuarios.deleteMany({});

  console.log('✅ Limpieza completada');

  // 2. Crear roles
  const roles = await createRoles();
  
  // 3. Crear permisos
  const permisos = await createPermisos();
  
  // 4. Asignar permisos a roles
  await assignPermisosToRoles(roles, permisos);
  
  // 5. Crear usuario administrador
  const adminUser = await createAdminUser();
  
  // 6. Asignar rol administrador
  await assignRoleToUser(adminUser.id, roles.administrador.id);
  
  // 7. Crear unidades de medida
  const unidades = await createUnidadesMedida();
  
  // 8. Crear categorías
  const categorias = await createCategorias();
  
  // 9. Crear marcas
  const marcas = await createMarcas();

  // 10. Crear atributos
  await createAtributos();
  
  // 11. Crear etiquetas
  const etiquetas = await createEtiquetas();
  
  // 12. Crear métodos de envío
  await createMetodosEnvio();
  
  // 13. Crear estados de orden
  await createEstadosOrden();
  
  // 14. Crear monedas
  await createMonedas();
  
  // 15. Crear productos
  await createProductos(categorias, marcas, unidades, etiquetas);

  // Después de crear los productos, asigna etiquetas
  async function asignarEtiquetas(productos: any[], etiquetas: any) {
    console.log('📝 Asignando etiquetas a productos...');
    
    // Producto 1: Destacado + Oferta
    await prisma.cat_producto_etiqueta.create({
      data: {
        producto_id: productos[0].id,
        etiqueta_id: etiquetas.destacado.id,
      },
    });
    
    // Producto 2: Destacado
    await prisma.cat_producto_etiqueta.create({
      data: {
        producto_id: productos[1].id,
        etiqueta_id: etiquetas.destacado.id,
      },
    });
    
    // Producto 3: Destacado + Oferta
    await prisma.cat_producto_etiqueta.create({
      data: {
        producto_id: productos[2].id,
        etiqueta_id: etiquetas.destacado.id,
      },
    });
    await prisma.cat_producto_etiqueta.create({
      data: {
        producto_id: productos[2].id,
        etiqueta_id: etiquetas.oferta.id,
      },
    });
    
    // Producto 4: Oferta
    await prisma.cat_producto_etiqueta.create({
      data: {
        producto_id: productos[3].id,
        etiqueta_id: etiquetas.oferta.id,
      },
    });
    
    // Producto 5: Destacado + Nuevo
    await prisma.cat_producto_etiqueta.create({
      data: {
        producto_id: productos[4].id,
        etiqueta_id: etiquetas.destacado.id,
      },
    });
    await prisma.cat_producto_etiqueta.create({
      data: {
        producto_id: productos[4].id,
        etiqueta_id: etiquetas.nuevo.id,
      },
    });
  }
  
  // 16. Crear configuración del sistema
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

async function createPermisos() {
  console.log('📝 Creando permisos...');
  
  const permisosData = [
    { modulo: 'productos', accion: 'leer' },
    { modulo: 'productos', accion: 'crear' },
    { modulo: 'productos', accion: 'editar' },
    { modulo: 'productos', accion: 'eliminar' },
    { modulo: 'inventario', accion: 'leer' },
    { modulo: 'inventario', accion: 'crear' },
    { modulo: 'inventario', accion: 'editar' },
    { modulo: 'inventario', accion: 'eliminar' },
    { modulo: 'ordenes', accion: 'leer' },
    { modulo: 'ordenes', accion: 'crear' },
    { modulo: 'ordenes', accion: 'editar' },
    { modulo: 'ordenes', accion: 'aprobar' },
    { modulo: 'clientes', accion: 'leer' },
    { modulo: 'clientes', accion: 'crear' },
    { modulo: 'clientes', accion: 'editar' },
    { modulo: 'clientes', accion: 'eliminar' },
    { modulo: 'usuarios', accion: 'leer' },
    { modulo: 'usuarios', accion: 'crear' },
    { modulo: 'usuarios', accion: 'editar' },
    { modulo: 'usuarios', accion: 'eliminar' },
    { modulo: 'reportes', accion: 'leer' },
    { modulo: 'reportes', accion: 'crear' },
    { modulo: 'estadisticas', accion: 'leer' },
  ];
  
  const permisos: Record<string, any> = {};
  
  for (const permisoData of permisosData) {
    const permiso = await prisma.seg_permisos.create({
      data: permisoData,
    });
    const key = `${permisoData.modulo}_${permisoData.accion}`;
    permisos[key] = permiso;
  }
  console.log(`  - Permisos creados: ${Object.keys(permisos).length}`);
  
  return permisos;
}

async function assignPermisosToRoles(roles: any, permisos: any) {
  console.log('📝 Asignando permisos a roles...');
  
  // Administrador: todos los permisos
  const adminRol = roles.administrador;
  if (adminRol) {
    for (const permiso of Object.values(permisos)) {
      await prisma.seg_rol_permiso.create({
        data: { rol_id: adminRol.id, permiso_id: (permiso as any).id },
      });
    }
    console.log(`  - Asignados todos los permisos a rol administrador`);
  }
  
  // Gerente Ventas
  const ventasRol = roles.gerente_ventas;
  if (ventasRol) {
    const ventasPermisos = [
      permisos.productos_leer,
      permisos.ordenes_leer, permisos.ordenes_editar, permisos.ordenes_aprobar,
      permisos.clientes_leer,
      permisos.reportes_leer, permisos.reportes_crear,
      permisos.estadisticas_leer,
    ];
    for (const permiso of ventasPermisos) {
      if (permiso) {
        await prisma.seg_rol_permiso.create({
          data: { rol_id: ventasRol.id, permiso_id: permiso.id },
        });
      }
    }
    console.log(`  - Asignados permisos a rol gerente_ventas`);
  }
  
  // Gerente Inventario
  const inventarioRol = roles.gerente_inventario;
  if (inventarioRol) {
    const inventarioPermisos = [
      permisos.productos_leer, permisos.productos_crear, permisos.productos_editar,
      permisos.inventario_leer, permisos.inventario_crear, permisos.inventario_editar,
      permisos.ordenes_leer,
      permisos.reportes_leer,
    ];
    for (const permiso of inventarioPermisos) {
      if (permiso) {
        await prisma.seg_rol_permiso.create({
          data: { rol_id: inventarioRol.id, permiso_id: permiso.id },
        });
      }
    }
    console.log(`  - Asignados permisos a rol gerente_inventario`);
  }
  
  // Vendedor
  const vendedorRol = roles.vendedor;
  if (vendedorRol) {
    const vendedorPermisos = [
      permisos.productos_leer,
      permisos.ordenes_leer, permisos.ordenes_editar,
      permisos.clientes_leer,
    ];
    for (const permiso of vendedorPermisos) {
      if (permiso) {
        await prisma.seg_rol_permiso.create({
          data: { rol_id: vendedorRol.id, permiso_id: permiso.id },
        });
      }
    }
    console.log(`  - Asignados permisos a rol vendedor`);
  }
}

async function createAdminUser() {
  console.log('📝 Creando usuario administrador...');
  
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  const adminUser = await prisma.seg_usuarios.create({
    data: {
      email: 'admin@ecommerce.com',
      password_hash: hashedPassword,
      email_verificado: true,
      activo: true,
    },
  });
  
  console.log(`  - Usuario admin creado: admin@ecommerce.com / Admin123!`);
  
  // Crear cliente asociado
  await prisma.cli_clientes.create({
    data: {
      usuario_id: adminUser.id,
      telefono: '999999999',
      total_gastado: 0,
      segmento: 'vip',
    },
  });
  
  return adminUser;
}

async function assignRoleToUser(usuarioId: number, rolId: number) {
  await prisma.seg_usuario_rol.create({
    data: { usuario_id: usuarioId, rol_id: rolId },
  });
  console.log(`  - Rol asignado a usuario ${usuarioId}`);
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
    { nombre: 'Camisetas', slug: 'camisetas', categoria: 'Ropa y Accesorios' },
    { nombre: 'Pantalones', slug: 'pantalones', categoria: 'Ropa y Accesorios' },
    { nombre: 'Zapatos', slug: 'zapatos', categoria: 'Ropa y Accesorios' },
    { nombre: 'Sartenes', slug: 'sartenes', categoria: 'Hogar y Cocina' },
    { nombre: 'Utensilios', slug: 'utensilios', categoria: 'Hogar y Cocina' },
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

// 10. Crear atributos (talla, color, etc.)
async function createAtributos() {
  console.log('📝 Creando atributos...');
  
  // Crear atributo Talla
  const tallaAtributo = await prisma.cat_atributos.create({
    data: {
      nombre: 'Talla',
      tipo: 'texto',
    },
  });
  
  // Crear valores para Talla
  const tallas = ['S', 'M', 'L', 'XL', 'XXL'];
  for (const talla of tallas) {
    await prisma.cat_valores_atributo.create({
      data: {
        atributo_id: tallaAtributo.id,
        valor: talla,
      },
    });
  }
  
  // Crear atributo Color
  const colorAtributo = await prisma.cat_atributos.create({
    data: {
      nombre: 'Color',
      tipo: 'color',
    },
  });
  
  // Crear valores para Color
  const colores = ['Rojo', 'Azul', 'Negro', 'Blanco', 'Verde'];
  for (const color of colores) {
    await prisma.cat_valores_atributo.create({
      data: {
        atributo_id: colorAtributo.id,
        valor: color,
      },
    });
  }
  
  // Crear atributo Material
  const materialAtributo = await prisma.cat_atributos.create({
    data: {
      nombre: 'Material',
      tipo: 'texto',
    },
  });
  
  // Crear valores para Material
  const materiales = ['Algodón', 'Poliéster', 'Cuero', 'Plástico', 'Metal'];
  for (const material of materiales) {
    await prisma.cat_valores_atributo.create({
      data: {
        atributo_id: materialAtributo.id,
        valor: material,
      },
    });
  }
  
  console.log('  - Atributos creados: Talla, Color, Material');
  
  // Asignar atributos a algunos productos
  const productos = await prisma.cat_productos.findMany({
    take: 5,
  });
  
  const tallaValores = await prisma.cat_valores_atributo.findMany({
    where: { atributo_id: tallaAtributo.id },
  });
  
  const colorValores = await prisma.cat_valores_atributo.findMany({
    where: { atributo_id: colorAtributo.id },
  });
  
  for (const producto of productos) {
    // Asignar una talla aleatoria
    const tallaRandom = tallaValores[Math.floor(Math.random() * tallaValores.length)];
    await prisma.cat_producto_atributo.create({
      data: {
        producto_id: producto.id,
        atributo_id: tallaAtributo.id,
        valor_id: tallaRandom.id,
        stock: 10,
      },
    });
    
    // Asignar un color aleatorio
    const colorRandom = colorValores[Math.floor(Math.random() * colorValores.length)];
    await prisma.cat_producto_atributo.create({
      data: {
        producto_id: producto.id,
        atributo_id: colorAtributo.id,
        valor_id: colorRandom.id,
        stock: 5,
      },
    });
  }
  
  return { tallaAtributo, colorAtributo, materialAtributo };
}

async function createEtiquetas() {
  console.log('📝 Creando etiquetas...');
  
  const etiquetasData = ['destacado', 'oferta', 'nuevo', 'agotado', 'más vendido'];
  
  const etiquetas: Record<string, any> = {};
  
  for (const nombre of etiquetasData) {
    const etiqueta = await prisma.cat_etiquetas.create({
      data: { nombre },
    });
    etiquetas[nombre] = etiqueta;
    console.log(`  - Etiqueta creada: ${etiqueta.nombre}`);
  }
  
  return etiquetas;
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

async function createEstadosOrden() {
  console.log('📝 Creando estados de orden...');
  
  const estadosData = [
    { nombre: 'pendiente_pago', orden: 1 },
    { nombre: 'pagada', orden: 2 },
    { nombre: 'en_proceso', orden: 3 },
    { nombre: 'enviada', orden: 4 },
    { nombre: 'entregada', orden: 5 },
    { nombre: 'cancelada', orden: 6 },
    { nombre: 'devuelta', orden: 7 },
  ];
  
  for (const estadoData of estadosData) {
    await prisma.ord_estados_orden.create({
      data: estadoData,
    });
    console.log(`  - Estado creado: ${estadoData.nombre}`);
  }
}

async function createMonedas() {
  console.log('📝 Creando monedas...');
  
  const monedasData = [
    { codigo: 'PEN', simbolo: 'S/', tasa_cambio_default: 1 },
    { codigo: 'USD', simbolo: '$', tasa_cambio_default: 3.7 },
  ];
  
  for (const monedaData of monedasData) {
    await prisma.monedas.create({
      data: monedaData,
    });
    console.log(`  - Moneda creada: ${monedaData.codigo}`);
  }
}

async function createProductos(categorias: any, marcas: any, unidades: any, etiquetas: any) {
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
      es_destacado: true,
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
      es_destacado: true,
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
      es_oferta: true,
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
      es_oferta: true,
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
      },
    });
    
    // Asignar etiquetas
    if (prodData.es_oferta) {
      await prisma.cat_producto_etiqueta.create({
        data: { 
          producto_id: producto.id, 
          etiqueta_id: etiquetas.oferta.id 
        },
      });
    }
    
    if (prodData.es_destacado) {
      await prisma.cat_producto_etiqueta.create({
        data: { 
          producto_id: producto.id, 
          etiqueta_id: etiquetas.destacado.id 
        },
      });
    }
    
    console.log(`  - Producto creado: ${producto.nombre}`);
  }
}

// Crear reseñas de ejemplo
async function createResenas() {
  console.log('📝 Creando reseñas de ejemplo...');
  
  // Obtener clientes y productos
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
      data: confData,
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