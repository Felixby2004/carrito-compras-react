import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from './errorHandler';

type Permiso = {
  modulo: string;
  accion: 'leer' | 'crear' | 'editar' | 'eliminar' | 'aprobar';
};

// Mapeo de roles a permisos
const rolePermissions: Record<string, Permiso[]> = {
  administrador: [
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
  ],
  gerente_ventas: [
    { modulo: 'productos', accion: 'leer' },
    { modulo: 'ordenes', accion: 'leer' },
    { modulo: 'ordenes', accion: 'editar' },
    { modulo: 'ordenes', accion: 'aprobar' },
    { modulo: 'clientes', accion: 'leer' },
    { modulo: 'reportes', accion: 'leer' },
    { modulo: 'estadisticas', accion: 'leer' },
  ],
  gerente_inventario: [
    { modulo: 'productos', accion: 'leer' },
    { modulo: 'productos', accion: 'crear' },
    { modulo: 'productos', accion: 'editar' },
    { modulo: 'inventario', accion: 'leer' },
    { modulo: 'inventario', accion: 'crear' },
    { modulo: 'inventario', accion: 'editar' },
    { modulo: 'ordenes', accion: 'leer' },
    { modulo: 'reportes', accion: 'leer' },
  ],
  vendedor: [
    { modulo: 'productos', accion: 'leer' },
    { modulo: 'ordenes', accion: 'leer' },
    { modulo: 'ordenes', accion: 'editar' },
    { modulo: 'clientes', accion: 'leer' },
  ],
  cliente: [
    { modulo: 'productos', accion: 'leer' },
    { modulo: 'carrito', accion: 'leer' },
    { modulo: 'carrito', accion: 'crear' },
    { modulo: 'carrito', accion: 'editar' },
    { modulo: 'carrito', accion: 'eliminar' },
    { modulo: 'ordenes_propias', accion: 'leer' },
    { modulo: 'ordenes_propias', accion: 'crear' },
    { modulo: 'perfil', accion: 'leer' },
    { modulo: 'perfil', accion: 'editar' },
  ],
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }
    
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return next(new AppError('No tiene permisos para acceder a este recurso', 403));
    }
    
    next();
  };
};

export const requirePermission = (modulo: string, accion: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }
    
    const hasPermission = req.user.roles.some(role => {
      const permissions = rolePermissions[role] || [];
      return permissions.some(p => p.modulo === modulo && p.accion === accion);
    });
    
    if (!hasPermission) {
      return next(new AppError(`No tiene permiso para ${accion} en ${modulo}`, 403));
    }
    
    next();
  };
};