import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    roles: string[];
  };
}

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

export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
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
    
    if (usuario) {
      req.user = {
        id: usuario.id,
        email: usuario.email,
        roles: usuario.usuario_roles.map((ur: any) => ur.rol.nombre),
      };
    }
    
    next();
  } catch (error) {
    // Si hay un error con el token (expirado, inválido), simplemente continuamos sin usuario
    // A menos que sea un error de base de datos crítico, pero por ahora seguimos
    next();
  }
};