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
  // Órdenes de compra / recepciones (referencian productos y proveedores)
  await prisma.inv_recepciones.deleteMany({});
  await prisma.inv_detalle_orden_compra.deleteMany({});
  await prisma.inv_ordenes_compra.deleteMany({});
  await prisma.inv_proveedores.deleteMany({});
  await prisma.cat_producto_etiqueta.deleteMany({});
  await prisma.cat_producto_atributo.deleteMany({});
  await prisma.cat_imagenes_producto.deleteMany({});
  await prisma.cat_productos.deleteMany({});
  await prisma.cat_subcategorias.deleteMany({});
  await prisma.cat_categorias.deleteMany({});
  await prisma.cat_marcas.deleteMany({});
  await prisma.cat_unidades_medida.deleteMany({});
  await prisma.cat_etiquetas.deleteMany({});
  await prisma.cat_valores_atributo.deleteMany({});
  await prisma.cat_atributos.deleteMany({});
  await prisma.ord_cupones.deleteMany({});
  await prisma.ord_metodos_envio.deleteMany({});
  await prisma.ord_estados_orden.deleteMany({});
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

  // 6b. Crear usuarios demo por rol (para pruebas del panel)
  await createDemoUsers(roles);
  
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

async function createDemoUsers(roles: any) {
  console.log('📝 Creando usuarios demo por rol...');

  const demo = [
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

    // Electrónicos - variedad
    { sku: 'XIA-13-006', nombre: 'Xiaomi 13', descripcion_corta: 'Smartphone Android premium', categoria: 'Electrónicos', subcategoria: 'Teléfonos', marca: 'Xiaomi', precio_costo: 1800.00, precio_venta: 2399.00, peso: 0.171, stock: 40, stock_minimo: 8, es_destacado: true },
    { sku: 'SAM-TVAU-007', nombre: 'Samsung Smart TV 55" 4K', descripcion_corta: 'Smart TV UHD 4K con HDR', categoria: 'Electrónicos', subcategoria: 'TV y Video', marca: 'Samsung', precio_costo: 2200.00, precio_venta: 2999.00, peso: 14.5, stock: 18, stock_minimo: 4 },
    { sku: 'LG-OLED-008', nombre: 'LG OLED TV 48"', descripcion_corta: 'OLED con negros perfectos', categoria: 'Electrónicos', subcategoria: 'TV y Video', marca: 'LG', precio_costo: 3200.00, precio_venta: 4199.00, peso: 12.8, stock: 10, stock_minimo: 3 },
    { sku: 'LEN-LEG5-009', nombre: 'Lenovo Legion 5', descripcion_corta: 'Laptop gamer Ryzen + RTX', categoria: 'Electrónicos', subcategoria: 'Laptops', marca: 'Lenovo', precio_costo: 3800.00, precio_venta: 4999.00, peso: 2.4, stock: 12, stock_minimo: 3 },
    { sku: 'ASU-ZEP-010', nombre: 'ASUS ZenBook 14', descripcion_corta: 'Ultrabook ligero para productividad', categoria: 'Electrónicos', subcategoria: 'Laptops', marca: 'ASUS', precio_costo: 3100.00, precio_venta: 4199.00, peso: 1.3, stock: 15, stock_minimo: 4 },
    { sku: 'MIC-SUR-011', nombre: 'Microsoft Surface Pro', descripcion_corta: 'Tablet 2-en-1 para estudio y trabajo', categoria: 'Electrónicos', subcategoria: 'Tablets', marca: 'Microsoft', precio_costo: 3500.00, precio_venta: 4699.00, peso: 0.88, stock: 10, stock_minimo: 2 },
    { sku: 'APL-IPAD-012', nombre: 'iPad (10ª gen)', descripcion_corta: 'Tablet para entretenimiento y estudio', categoria: 'Electrónicos', subcategoria: 'Tablets', marca: 'Apple', precio_costo: 1600.00, precio_venta: 2199.00, peso: 0.48, stock: 22, stock_minimo: 5 },
    { sku: 'APL-WAT-013', nombre: 'Apple Watch Series 9', descripcion_corta: 'Smartwatch con monitoreo de salud', categoria: 'Electrónicos', subcategoria: 'Smartwatch', marca: 'Apple', precio_costo: 1400.00, precio_venta: 1899.00, peso: 0.06, stock: 25, stock_minimo: 6, es_destacado: true },
    { sku: 'SAM-WAT-014', nombre: 'Samsung Galaxy Watch', descripcion_corta: 'Smartwatch deportivo', categoria: 'Electrónicos', subcategoria: 'Smartwatch', marca: 'Samsung', precio_costo: 900.00, precio_venta: 1299.00, peso: 0.06, stock: 28, stock_minimo: 6 },
    { sku: 'CAN-EOS-015', nombre: 'Canon EOS M50', descripcion_corta: 'Cámara mirrorless para creadores', categoria: 'Electrónicos', subcategoria: 'Cámaras', marca: 'Canon', precio_costo: 2100.00, precio_venta: 2799.00, peso: 0.39, stock: 8, stock_minimo: 2 },
    { sku: 'GOP-HERO-016', nombre: 'GoPro HERO', descripcion_corta: 'Cámara de acción 4K resistente', categoria: 'Electrónicos', subcategoria: 'Cámaras', marca: 'GoPro', precio_costo: 1200.00, precio_venta: 1599.00, peso: 0.15, stock: 16, stock_minimo: 4 },
    { sku: 'PS5-CON-017', nombre: 'PlayStation 5', descripcion_corta: 'Consola next-gen', categoria: 'Electrónicos', subcategoria: 'Consolas', marca: 'PlayStation', precio_costo: 2400.00, precio_venta: 3199.00, peso: 4.5, stock: 10, stock_minimo: 3 },
    { sku: 'NIN-SWI-018', nombre: 'Nintendo Switch', descripcion_corta: 'Consola híbrida portátil', categoria: 'Electrónicos', subcategoria: 'Consolas', marca: 'Nintendo', precio_costo: 1200.00, precio_venta: 1599.00, peso: 0.4, stock: 14, stock_minimo: 4 },
    { sku: 'JBL-FLP-019', nombre: 'JBL Flip 6', descripcion_corta: 'Parlante bluetooth portátil', categoria: 'Electrónicos', subcategoria: 'Audífonos', marca: 'JBL', precio_costo: 320.00, precio_venta: 499.00, peso: 0.55, stock: 35, stock_minimo: 10, es_oferta: true, precio_oferta: 449.00, fecha_inicio_oferta: new Date(), fecha_fin_oferta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },

    // Ropa y Accesorios
    { sku: 'NKE-TSH-020', nombre: 'Nike Dri-FIT Camiseta', descripcion_corta: 'Camiseta deportiva transpirable', categoria: 'Ropa y Accesorios', subcategoria: 'Camisetas', marca: 'Nike', precio_costo: 45.00, precio_venta: 89.00, peso: 0.22, stock: 120, stock_minimo: 30 },
    { sku: 'ADS-JAC-021', nombre: 'Adidas Chaqueta Essentials', descripcion_corta: 'Chaqueta ligera para clima fresco', categoria: 'Ropa y Accesorios', subcategoria: 'Chaquetas', marca: 'Adidas', precio_costo: 110.00, precio_venta: 179.00, peso: 0.55, stock: 60, stock_minimo: 12 },
    { sku: 'PUM-SNK-022', nombre: 'Puma Smash V2', descripcion_corta: 'Zapatillas casuales clásicas', categoria: 'Ropa y Accesorios', subcategoria: 'Zapatos', marca: 'Puma', precio_costo: 120.00, precio_venta: 199.00, peso: 0.75, stock: 70, stock_minimo: 15, es_oferta: true, precio_oferta: 169.00, fecha_inicio_oferta: new Date(), fecha_fin_oferta: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
    { sku: 'UA-PAN-023', nombre: 'Under Armour Jogger', descripcion_corta: 'Pantalón jogger cómodo', categoria: 'Ropa y Accesorios', subcategoria: 'Pantalones', marca: 'Under Armour', precio_costo: 95.00, precio_venta: 159.00, peso: 0.5, stock: 55, stock_minimo: 10 },
    { sku: 'NBS-SNK-024', nombre: 'New Balance 574', descripcion_corta: 'Zapatillas urbanas icónicas', categoria: 'Ropa y Accesorios', subcategoria: 'Zapatos', marca: 'New Balance', precio_costo: 160.00, precio_venta: 249.00, peso: 0.78, stock: 50, stock_minimo: 10 },
    { sku: 'ADS-BAG-025', nombre: 'Adidas Mochila Classic', descripcion_corta: 'Mochila para uso diario', categoria: 'Ropa y Accesorios', subcategoria: 'Accesorios', marca: 'Adidas', precio_costo: 55.00, precio_venta: 99.00, peso: 0.35, stock: 80, stock_minimo: 20 },

    // Hogar y Cocina
    { sku: 'BOS-MIX-026', nombre: 'Bosch Batidora de Mano', descripcion_corta: 'Batidora para cocina diaria', categoria: 'Hogar y Cocina', subcategoria: 'Electrodomésticos', marca: 'Bosch', precio_costo: 120.00, precio_venta: 189.00, peso: 1.1, stock: 30, stock_minimo: 6 },
    { sku: 'KIT-STD-027', nombre: 'KitchenAid Juego de Utensilios', descripcion_corta: 'Set de utensilios de cocina', categoria: 'Hogar y Cocina', subcategoria: 'Utensilios', marca: 'KitchenAid', precio_costo: 90.00, precio_venta: 149.00, peso: 1.2, stock: 40, stock_minimo: 8 },
    { sku: 'PHI-AIR-028', nombre: 'Philips Airfryer', descripcion_corta: 'Freidora de aire para comidas saludables', categoria: 'Hogar y Cocina', subcategoria: 'Electrodomésticos', marca: 'Philips', precio_costo: 420.00, precio_venta: 599.00, peso: 5.3, stock: 18, stock_minimo: 4, es_destacado: true },
    { sku: 'DYS-VAC-029', nombre: 'Dyson Aspiradora', descripcion_corta: 'Aspiradora sin cable potente', categoria: 'Hogar y Cocina', subcategoria: 'Limpieza', marca: 'Dyson', precio_costo: 1600.00, precio_venta: 2199.00, peso: 2.7, stock: 8, stock_minimo: 2 },
    { sku: 'PAN-MIC-030', nombre: 'Panasonic Microondas', descripcion_corta: 'Microondas 25L', categoria: 'Hogar y Cocina', subcategoria: 'Electrodomésticos', marca: 'Panasonic', precio_costo: 380.00, precio_venta: 549.00, peso: 11.0, stock: 16, stock_minimo: 4 },
    { sku: 'DEC-LMP-031', nombre: 'Lámpara de Mesa Minimalista', descripcion_corta: 'Lámpara decorativa para escritorio', categoria: 'Hogar y Cocina', subcategoria: 'Decoración', marca: 'Philips', precio_costo: 75.00, precio_venta: 129.00, peso: 0.9, stock: 50, stock_minimo: 10 },

    // Deportes y Aire Libre
    { sku: 'NKE-MAT-032', nombre: 'Mat de Yoga', descripcion_corta: 'Colchoneta antideslizante', categoria: 'Deportes y Aire Libre', subcategoria: 'Fitness', marca: 'Nike', precio_costo: 40.00, precio_venta: 79.00, peso: 0.9, stock: 90, stock_minimo: 20 },
    { sku: 'ADS-DBL-033', nombre: 'Mancuernas Ajustables', descripcion_corta: 'Set de mancuernas para entrenamiento', categoria: 'Deportes y Aire Libre', subcategoria: 'Fitness', marca: 'Adidas', precio_costo: 220.00, precio_venta: 349.00, peso: 10.0, stock: 25, stock_minimo: 5 },
    { sku: 'COL-JKT-034', nombre: 'Columbia Chaqueta Impermeable', descripcion_corta: 'Chaqueta para lluvia y trekking', categoria: 'Deportes y Aire Libre', subcategoria: 'Camping', marca: 'Columbia', precio_costo: 210.00, precio_venta: 329.00, peso: 0.65, stock: 22, stock_minimo: 5 },
    { sku: 'CMP-TNT-035', nombre: 'Carpa 2 Personas', descripcion_corta: 'Carpa compacta para camping', categoria: 'Deportes y Aire Libre', subcategoria: 'Camping', marca: 'Columbia', precio_costo: 280.00, precio_venta: 429.00, peso: 2.6, stock: 12, stock_minimo: 3 },
    { sku: 'CYC-HLM-036', nombre: 'Casco de Ciclismo', descripcion_corta: 'Casco ligero con ventilación', categoria: 'Deportes y Aire Libre', subcategoria: 'Ciclismo', marca: 'Under Armour', precio_costo: 60.00, precio_venta: 119.00, peso: 0.28, stock: 45, stock_minimo: 10 },

    // Libros y Entretenimiento
    { sku: 'BOK-HP1-037', nombre: 'Harry Potter y la piedra filosofal', descripcion_corta: 'Novela de fantasía (tapa blanda)', categoria: 'Libros y Entretenimiento', subcategoria: 'Novelas', marca: 'Penguin', precio_costo: 18.00, precio_venta: 39.00, peso: 0.35, stock: 200, stock_minimo: 40 },
    { sku: 'BOK-1984-038', nombre: '1984 - George Orwell', descripcion_corta: 'Clásico distópico', categoria: 'Libros y Entretenimiento', subcategoria: 'Novelas', marca: 'Planeta', precio_costo: 14.00, precio_venta: 34.00, peso: 0.3, stock: 180, stock_minimo: 35, es_oferta: true, precio_oferta: 29.00, fecha_inicio_oferta: new Date(), fecha_fin_oferta: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) },
    { sku: 'COM-MAR-039', nombre: 'Marvel: Spider-Man (Vol. 1)', descripcion_corta: 'Cómic de colección', categoria: 'Libros y Entretenimiento', subcategoria: 'Cómics', marca: 'Marvel', precio_costo: 10.00, precio_venta: 24.00, peso: 0.18, stock: 140, stock_minimo: 25 },
    { sku: 'COM-DCB-040', nombre: 'DC: Batman (Año Uno)', descripcion_corta: 'Cómic clásico', categoria: 'Libros y Entretenimiento', subcategoria: 'Cómics', marca: 'DC', precio_costo: 11.00, precio_venta: 26.00, peso: 0.2, stock: 120, stock_minimo: 20 },
    { sku: 'GME-ZEL-041', nombre: 'The Legend of Zelda (Switch)', descripcion_corta: 'Videojuego aventura', categoria: 'Libros y Entretenimiento', subcategoria: 'Videojuegos', marca: 'Nintendo', precio_costo: 180.00, precio_venta: 259.00, peso: 0.1, stock: 40, stock_minimo: 8 },
    { sku: 'GME-FIF-042', nombre: 'EA Sports FC (PS5)', descripcion_corta: 'Videojuego de fútbol', categoria: 'Libros y Entretenimiento', subcategoria: 'Videojuegos', marca: 'PlayStation', precio_costo: 180.00, precio_venta: 259.00, peso: 0.1, stock: 38, stock_minimo: 8 },
    { sku: 'TOY-LEG-043', nombre: 'LEGO Classic Box', descripcion_corta: 'Bloques creativos para construir', categoria: 'Libros y Entretenimiento', subcategoria: 'Videojuegos', marca: 'LEGO', precio_costo: 120.00, precio_venta: 189.00, peso: 1.0, stock: 55, stock_minimo: 12 },

    // Salud y Belleza
    { sku: 'NIV-CRE-044', nombre: 'Nivea Crema Hidratante', descripcion_corta: 'Hidratación diaria', categoria: 'Salud y Belleza', subcategoria: 'Cuidado de la piel', marca: 'Nivea', precio_costo: 8.00, precio_venta: 19.90, peso: 0.25, stock: 150, stock_minimo: 30 },
    { sku: 'LOR-SER-045', nombre: "L'Oréal Sérum Facial", descripcion_corta: 'Sérum para cuidado facial', categoria: 'Salud y Belleza', subcategoria: 'Cuidado de la piel', marca: "L'Oréal", precio_costo: 28.00, precio_venta: 59.90, peso: 0.12, stock: 90, stock_minimo: 18, es_destacado: true },
    { sku: 'MAY-MAS-046', nombre: 'Maybelline Máscara de Pestañas', descripcion_corta: 'Volumen y definición', categoria: 'Salud y Belleza', subcategoria: 'Cuidado de la piel', marca: 'Maybelline', precio_costo: 16.00, precio_venta: 35.90, peso: 0.08, stock: 110, stock_minimo: 20 },
    { sku: 'GIL-RZR-047', nombre: 'Gillette Afeitadora', descripcion_corta: 'Afeitado suave', categoria: 'Salud y Belleza', subcategoria: 'Higiene', marca: 'Gillette', precio_costo: 12.00, precio_venta: 29.90, peso: 0.15, stock: 130, stock_minimo: 25 },
    { sku: 'ORB-BRS-048', nombre: 'Oral-B Cepillo Dental Eléctrico', descripcion_corta: 'Limpieza profunda', categoria: 'Salud y Belleza', subcategoria: 'Higiene', marca: 'Oral-B', precio_costo: 85.00, precio_venta: 149.90, peso: 0.45, stock: 40, stock_minimo: 8 },
    { sku: 'SUP-VIT-049', nombre: 'Vitaminas Multivitamínico', descripcion_corta: 'Suplemento diario', categoria: 'Salud y Belleza', subcategoria: 'Suplementos', marca: 'Nivea', precio_costo: 20.00, precio_venta: 49.90, peso: 0.2, stock: 70, stock_minimo: 15 },
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