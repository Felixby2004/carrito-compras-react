// backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

// Definición de AuthRequest
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    roles: string[];
  };
}

// Middleware de autenticación (el que necesitas)
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('Token no proporcionado', 401);
    }
    
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: number;
      email: string;
    };
    
    const usuario = await prisma.seg_usuarios.findUnique({
      where: { id: decoded.id, activo: true },
      include: {
        usuario_roles: {
          include: {
            rol: true,
          },
        },
      },
    });
    
    if (!usuario) {
      throw new AppError('Usuario no encontrado o inactivo', 401);
    }
    
    req.user = {
      id: usuario.id,
      email: usuario.email,
      roles: usuario.usuario_roles.map((ur: any) => ur.rol.nombre),
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido o expirado', 401));
    } else {
      next(error);
    }
  }
};

// Middleware de auditoría (opcional, puedes mantenerlo)
export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;

  res.send = function (data: any) {
    if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.auditAction) {
      const { accion, modulo, tabla, registro_id, datos_anteriores, datos_nuevos } = res.locals.auditAction;
      const ip = req.ip || req.connection.remoteAddress || 'desconocida';
      const usuario_id = (req as AuthRequest).user?.id;

      // (Opcional) registrar auditoría
      console.log('Auditoría:', { usuario_id, accion, modulo, tabla, registro_id, ip });
    }
    return originalSend.call(this, data);
  };

  next();
};

export const crearAuditAction = (
  accion: 'crear' | 'editar' | 'eliminar' | 'cambio_estado',
  modulo: string,
  tabla: string,
  registro_id?: number,
  datos_anteriores?: any,
  datos_nuevos?: any
) => {
  return { accion, modulo, tabla, registro_id, datos_anteriores, datos_nuevos };
};