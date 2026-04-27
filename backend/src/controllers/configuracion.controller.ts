import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';

const prisma = new PrismaClient();
const CLAVE_TEMA = 'tema_sistema';

const temaSchema = z.object({
  colorPrimario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color primario inválido'),
  colorSecundario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color secundario inválido'),
  colorAcento: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color acento inválido'),
});

const temaDefault = {
  colorPrimario: '#2563eb',
  colorSecundario: '#0f172a',
  colorAcento: '#f59e0b',
};

export class ConfiguracionController {
  async getTemaPublico(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const config = await prisma.configuracion_sistema.findUnique({ where: { clave: CLAVE_TEMA } });
      const tema = config ? JSON.parse(config.valor) : temaDefault;
      res.json({ success: true, data: tema });
    } catch (error) {
      next(error);
    }
  }

  async getTemaAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const config = await prisma.configuracion_sistema.findUnique({ where: { clave: CLAVE_TEMA } });
      const tema = config ? JSON.parse(config.valor) : temaDefault;
      res.json({ success: true, data: tema });
    } catch (error) {
      next(error);
    }
  }

  async updateTema(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const data = temaSchema.parse(req.body);
      const saved = await prisma.configuracion_sistema.upsert({
        where: { clave: CLAVE_TEMA },
        update: { valor: JSON.stringify(data), descripcion: 'Colores del tema del sistema' },
        create: {
          clave: CLAVE_TEMA,
          valor: JSON.stringify(data),
          descripcion: 'Colores del tema del sistema',
        },
      });
      res.json({ success: true, message: 'Configuración guardada', data: JSON.parse(saved.valor) });
    } catch (error) {
      next(error);
    }
  }
}

