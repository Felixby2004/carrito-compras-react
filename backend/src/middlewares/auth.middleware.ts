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
  console.log('🔐 [optionalAuthenticate] Starting for URL:', req.url);
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 [optionalAuthenticate] No Bearer token found, continue as guest');
      return next();
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 [optionalAuthenticate] Token found, length:', token.length);
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as { id: number; email: string; };
      console.log('🔐 [optionalAuthenticate] Token decoded:', decoded);
    } catch (e) {
      console.error('🔐 [optionalAuthenticate] Token verification failed, continue as guest. Error:', e);
      return next();
    }
    
    const usuario = await prisma.seg_usuarios.findUnique({
      where: { id: decoded.id, activo: true },
      include: { usuario_roles: { include: { rol: true } } },
    });
    
    if (usuario) {
      console.log('🔐 [optionalAuthenticate] Usuario encontrado, setting req.user:', usuario.id, usuario.email);
      req.user = {
        id: usuario.id,
        email: usuario.email,
        roles: usuario.usuario_roles.map((ur: any) => ur.rol.nombre)
      };
    } else {
      console.log('🔐 [optionalAuthenticate] No usuario found with id:', decoded.id);
    }
  } catch (error) {
    console.error('🔐 [optionalAuthenticate] Unhandled error (ignored):', error);
  }
  console.log('🔐 [optionalAuthenticate] Calling next(), req.user exists:', !!req.user);
  next(); // Always continue no matter what!
};