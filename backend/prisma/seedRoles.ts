import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRoles() {
  console.log('🌱 Iniciando seed de roles y permisos...');

  try {
    // Definir todos los roles y sus permisos
    const rolesData = [
      {
        nombre: 'administrador',
        descripcion: 'Administrador del sistema con acceso total',
        permisos: [
          // Productos
          { modulo: 'productos', accion: 'leer' },
          { modulo: 'productos', accion: 'crear' },
          { modulo: 'productos', accion: 'editar' },
          { modulo: 'productos', accion: 'eliminar' },
          // Categorías y Marcas
          { modulo: 'categorias', accion: 'leer' },
          { modulo: 'categorias', accion: 'crear' },
          { modulo: 'categorias', accion: 'editar' },
          { modulo: 'categorias', accion: 'eliminar' },
          { modulo: 'marcas', accion: 'leer' },
          { modulo: 'marcas', accion: 'crear' },
          { modulo: 'marcas', accion: 'editar' },
          { modulo: 'marcas', accion: 'eliminar' },
          // Inventario
          { modulo: 'inventario', accion: 'leer' },
          { modulo: 'inventario', accion: 'crear' },
          { modulo: 'inventario', accion: 'editar' },
          { modulo: 'inventario', accion: 'eliminar' },
          // Órdenes
          { modulo: 'ordenes', accion: 'leer' },
          { modulo: 'ordenes', accion: 'crear' },
          { modulo: 'ordenes', accion: 'editar' },
          { modulo: 'ordenes', accion: 'eliminar' },
          { modulo: 'ordenes', accion: 'aprobar' },
          // Clientes
          { modulo: 'clientes', accion: 'leer' },
          { modulo: 'clientes', accion: 'crear' },
          { modulo: 'clientes', accion: 'editar' },
          { modulo: 'clientes', accion: 'eliminar' },
          // Cupones
          { modulo: 'cupones', accion: 'leer' },
          { modulo: 'cupones', accion: 'crear' },
          { modulo: 'cupones', accion: 'editar' },
          { modulo: 'cupones', accion: 'eliminar' },
          // Usuarios y Roles
          { modulo: 'usuarios', accion: 'leer' },
          { modulo: 'usuarios', accion: 'crear' },
          { modulo: 'usuarios', accion: 'editar' },
          { modulo: 'usuarios', accion: 'eliminar' },
          { modulo: 'roles', accion: 'leer' },
          { modulo: 'roles', accion: 'crear' },
          { modulo: 'roles', accion: 'editar' },
          { modulo: 'roles', accion: 'eliminar' },
          // Reportes y Estadísticas
          { modulo: 'reportes', accion: 'leer' },
          { modulo: 'reportes', accion: 'crear' },
          { modulo: 'estadisticas', accion: 'leer' },
          // Configuración
          { modulo: 'configuracion', accion: 'leer' },
          { modulo: 'configuracion', accion: 'editar' },
        ],
      },
      {
        nombre: 'gerente_ventas',
        descripcion: 'Gerente de ventas - Acceso a órdenes y reportes de ventas',
        permisos: [
          { modulo: 'productos', accion: 'leer' },
          { modulo: 'ordenes', accion: 'leer' },
          { modulo: 'ordenes', accion: 'editar' },
          { modulo: 'ordenes', accion: 'aprobar' },
          { modulo: 'clientes', accion: 'leer' },
          { modulo: 'cupones', accion: 'leer' },
          { modulo: 'cupones', accion: 'crear' },
          { modulo: 'cupones', accion: 'editar' },
          { modulo: 'reportes', accion: 'leer' },
          { modulo: 'estadisticas', accion: 'leer' },
          { modulo: 'dashboard', accion: 'leer' },
        ],
      },
      {
        nombre: 'gerente_inventario',
        descripcion: 'Gerente de inventario - Gestión de productos e inventario',
        permisos: [
          { modulo: 'productos', accion: 'leer' },
          { modulo: 'productos', accion: 'crear' },
          { modulo: 'productos', accion: 'editar' },
          { modulo: 'categorias', accion: 'leer' },
          { modulo: 'categorias', accion: 'crear' },
          { modulo: 'categorias', accion: 'editar' },
          { modulo: 'marcas', accion: 'leer' },
          { modulo: 'marcas', accion: 'crear' },
          { modulo: 'marcas', accion: 'editar' },
          { modulo: 'inventario', accion: 'leer' },
          { modulo: 'inventario', accion: 'crear' },
          { modulo: 'inventario', accion: 'editar' },
          { modulo: 'ordenes', accion: 'leer' },
          { modulo: 'reportes', accion: 'leer' },
          { modulo: 'estadisticas', accion: 'leer' },
        ],
      },
      {
        nombre: 'vendedor',
        descripcion: 'Vendedor/Atención al cliente - Manejo de órdenes y clientes',
        permisos: [
          { modulo: 'productos', accion: 'leer' },
          { modulo: 'ordenes', accion: 'leer' },
          { modulo: 'ordenes', accion: 'editar' },
          { modulo: 'clientes', accion: 'leer' },
          { modulo: 'facturas', accion: 'crear' },
          { modulo: 'facturas', accion: 'leer' },
        ],
      },
      {
        nombre: 'cliente',
        descripcion: 'Cliente - Comprador del sistema',
        permisos: [
          { modulo: 'productos', accion: 'leer' },
          { modulo: 'categorias', accion: 'leer' },
          { modulo: 'carrito', accion: 'leer' },
          { modulo: 'carrito', accion: 'crear' },
          { modulo: 'carrito', accion: 'editar' },
          { modulo: 'carrito', accion: 'eliminar' },
          { modulo: 'ordenes_propias', accion: 'leer' },
          { modulo: 'ordenes_propias', accion: 'crear' },
          { modulo: 'pagos', accion: 'crear' },
          { modulo: 'perfil', accion: 'leer' },
          { modulo: 'perfil', accion: 'editar' },
          { modulo: 'direcciones', accion: 'leer' },
          { modulo: 'direcciones', accion: 'crear' },
          { modulo: 'direcciones', accion: 'editar' },
          { modulo: 'direcciones', accion: 'eliminar' },
          { modulo: 'resenas', accion: 'crear' },
          { modulo: 'resenas', accion: 'leer' },
          { modulo: 'wishlist', accion: 'leer' },
          { modulo: 'wishlist', accion: 'crear' },
          { modulo: 'wishlist', accion: 'editar' },
          { modulo: 'wishlist', accion: 'eliminar' },
          { modulo: 'facturas', accion: 'leer' },
        ],
      },
      {
        nombre: 'invitado',
        descripcion: 'Invitado - Acceso limitado sin autenticación',
        permisos: [
          { modulo: 'productos', accion: 'leer' },
          { modulo: 'categorias', accion: 'leer' },
          { modulo: 'carrito_local', accion: 'leer' },
          { modulo: 'carrito_local', accion: 'crear' },
          { modulo: 'carrito_local', accion: 'editar' },
        ],
      },
    ];

    // Procesar cada rol
    for (const rolData of rolesData) {
      // Verificar si el rol ya existe
      let rol = await prisma.seg_roles.findUnique({
        where: { nombre: rolData.nombre },
      });

      if (!rol) {
        // Crear el rol
        rol = await prisma.seg_roles.create({
          data: {
            nombre: rolData.nombre,
            descripcion: rolData.descripcion,
          },
        });
        console.log(`✅ Rol "${rolData.nombre}" creado`);
      } else {
        console.log(`ℹ️  Rol "${rolData.nombre}" ya existe`);
      }

      // Procesar permisos para este rol
      for (const permisoData of rolData.permisos) {
        // Buscar o crear el permiso
        let permiso = await prisma.seg_permisos.findFirst({
          where: {
            modulo: permisoData.modulo,
            accion: permisoData.accion,
          },
        });

        if (!permiso) {
          permiso = await prisma.seg_permisos.create({
            data: {
              modulo: permisoData.modulo,
              accion: permisoData.accion,
              descripcion: `${permisoData.accion} en ${permisoData.modulo}`,
            },
          });
        }

        // Crear relación rol-permiso si no existe
        const rolePermiso = await prisma.seg_rol_permiso.findFirst({
          where: {
            rol_id: rol.id,
            permiso_id: permiso.id,
          },
        });

        if (!rolePermiso) {
          await prisma.seg_rol_permiso.create({
            data: {
              rol_id: rol.id,
              permiso_id: permiso.id,
            },
          });
        }
      }
    }

    console.log('\n✅ Seed de roles y permisos completado exitosamente');
  } catch (error) {
    console.error('❌ Error en seed de roles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedRoles();
