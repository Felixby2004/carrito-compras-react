import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Usuario registrado exitosamente. Revise su email para verificar la cuenta.',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json({
        success: true,
        data: result,
        message: 'Login exitoso',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const result = await authService.refreshToken(refreshToken);
      res.json({
        success: true,
        data: result,
        message: 'Token refrescado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken;
      if (!refreshToken) {
        throw new AppError('Refresh token requerido', 400);
      }
      const result = await authService.logout(req.user!.id, refreshToken);
      res.json({
        success: true,
        data: result,
        message: 'Logout exitoso',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        throw new AppError('Token requerido', 400);
      }
      await authService.verifyEmail(token);
      res.json({
        success: true,
        message: 'Email verificado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new AppError('Email requerido', 400);
      }
      await authService.forgotPassword(email);
      res.json({
        success: true,
        message: 'Si el email existe, recibirá instrucciones para resetear su contraseña',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        throw new AppError('Token y nueva contraseña requeridos', 400);
      }
      await authService.resetPassword(token, newPassword);
      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}