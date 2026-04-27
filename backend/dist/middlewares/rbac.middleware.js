"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = void 0;
const errorHandler_1 = require("./errorHandler");
// Mapeo de roles a permisos - Actualizado con 6 roles del sistema
const rolePermissions = {
    // 1. ADMINISTRADOR - Acceso total
    administrador: [
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
        // Dashboard
        { modulo: 'dashboard', accion: 'leer' },
        // Configuración
        { modulo: 'configuracion', accion: 'leer' },
        { modulo: 'configuracion', accion: 'editar' },
    ],
    // 2. GERENTE DE VENTAS - Dashboard, órdenes, reportes de ventas
    gerente_ventas: [
        // Productos (solo lectura)
        { modulo: 'productos', accion: 'leer' },
        // Órdenes
        { modulo: 'ordenes', accion: 'leer' },
        { modulo: 'ordenes', accion: 'editar' },
        { modulo: 'ordenes', accion: 'aprobar' },
        // Clientes (solo lectura)
        { modulo: 'clientes', accion: 'leer' },
        // Cupones
        { modulo: 'cupones', accion: 'leer' },
        { modulo: 'cupones', accion: 'crear' },
        { modulo: 'cupones', accion: 'editar' },
        // Reportes y Estadísticas
        { modulo: 'reportes', accion: 'leer' },
        { modulo: 'estadisticas', accion: 'leer' },
        // Dashboard
        { modulo: 'dashboard', accion: 'leer' },
    ],
    // 3. GERENTE DE INVENTARIO - Productos, inventario, proveedores
    gerente_inventario: [
        // Productos (CRUD)
        { modulo: 'productos', accion: 'leer' },
        { modulo: 'productos', accion: 'crear' },
        { modulo: 'productos', accion: 'editar' },
        // Categorías y Marcas (CRUD)
        { modulo: 'categorias', accion: 'leer' },
        { modulo: 'categorias', accion: 'crear' },
        { modulo: 'categorias', accion: 'editar' },
        { modulo: 'marcas', accion: 'leer' },
        { modulo: 'marcas', accion: 'crear' },
        { modulo: 'marcas', accion: 'editar' },
        // Inventario (completo)
        { modulo: 'inventario', accion: 'leer' },
        { modulo: 'inventario', accion: 'crear' },
        { modulo: 'inventario', accion: 'editar' },
        // Órdenes (solo lectura)
        { modulo: 'ordenes', accion: 'leer' },
        // Reportes
        { modulo: 'reportes', accion: 'leer' },
        // Estadísticas (solo lectura de inventario)
        { modulo: 'estadisticas', accion: 'leer' },
    ],
    // 4. VENDEDOR/ATENCIÓN AL CLIENTE - Órdenes básicas, clientes, productos
    vendedor: [
        // Productos (solo lectura)
        { modulo: 'productos', accion: 'leer' },
        // Inventario (solo lectura para ver stock)
        { modulo: 'inventario', accion: 'leer' },
        // Órdenes (lectura y cambio de estado)
        { modulo: 'ordenes', accion: 'leer' },
        { modulo: 'ordenes', accion: 'editar' },
        // Clientes (solo lectura)
        { modulo: 'clientes', accion: 'leer' },
        // Facturas
        { modulo: 'facturas', accion: 'crear' },
        { modulo: 'facturas', accion: 'leer' },
    ],
    // 5. CLIENTE - Acceso de comprador
    cliente: [
        // Catálogo y búsqueda
        { modulo: 'productos', accion: 'leer' },
        { modulo: 'categorias', accion: 'leer' },
        // Carrito
        { modulo: 'carrito', accion: 'leer' },
        { modulo: 'carrito', accion: 'crear' },
        { modulo: 'carrito', accion: 'editar' },
        { modulo: 'carrito', accion: 'eliminar' },
        // Órdenes propias
        { modulo: 'ordenes_propias', accion: 'leer' },
        { modulo: 'ordenes_propias', accion: 'crear' },
        // Pagos
        { modulo: 'pagos', accion: 'crear' },
        // Perfil
        { modulo: 'perfil', accion: 'leer' },
        { modulo: 'perfil', accion: 'editar' },
        // Direcciones
        { modulo: 'direcciones', accion: 'leer' },
        { modulo: 'direcciones', accion: 'crear' },
        { modulo: 'direcciones', accion: 'editar' },
        { modulo: 'direcciones', accion: 'eliminar' },
        // Reseñas
        { modulo: 'resenas', accion: 'crear' },
        { modulo: 'resenas', accion: 'leer' },
        // Wishlist
        { modulo: 'wishlist', accion: 'leer' },
        { modulo: 'wishlist', accion: 'crear' },
        { modulo: 'wishlist', accion: 'editar' },
        { modulo: 'wishlist', accion: 'eliminar' },
        // Facturas propias
        { modulo: 'facturas', accion: 'leer' },
    ],
    // 6. INVITADO - Acceso limitado sin autenticación (lectura solamente)
    invitado: [
        // Catálogo y búsqueda
        { modulo: 'productos', accion: 'leer' },
        { modulo: 'categorias', accion: 'leer' },
        // Carrito local (sin persistencia)
        { modulo: 'carrito_local', accion: 'leer' },
        { modulo: 'carrito_local', accion: 'crear' },
        { modulo: 'carrito_local', accion: 'editar' },
    ],
};
// Alias comunes para evitar 403 por variaciones de nombre de rol
rolePermissions.admin = rolePermissions.administrador;
rolePermissions.gerente = rolePermissions.gerente_ventas;
rolePermissions.ventas = rolePermissions.gerente_ventas;
rolePermissions.inventory_manager = rolePermissions.gerente_inventario;
rolePermissions.sales_manager = rolePermissions.gerente_ventas;
const requireRole = (allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('No autenticado', 401));
        }
        const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
            return next(new errorHandler_1.AppError('No tiene permisos para acceder a este recurso', 403));
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (modulo, accion) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('No autenticado', 401));
        }
        const hasPermission = req.user.roles.some(role => {
            const permissions = rolePermissions[role] || [];
            return permissions.some(p => p.modulo === modulo && p.accion === accion);
        });
        if (!hasPermission) {
            return next(new errorHandler_1.AppError(`No tiene permiso para ${accion} en ${modulo}`, 403));
        }
        next();
    };
};
exports.requirePermission = requirePermission;
