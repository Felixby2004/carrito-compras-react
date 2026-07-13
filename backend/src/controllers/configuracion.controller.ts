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
  logoUrl: z.string().optional().nullable(),
  nombreTienda: z.string().optional().nullable(),
});

const temaDefault = {
  colorPrimario: '#2563eb',
  colorSecundario: '#0f172a',
  colorAcento: '#f59e0b',
  logoUrl: null,
  nombreTienda: 'eMarket Perú',
};

const normalizeNombreTienda = (nombreTienda?: string | null) => {
  if (!nombreTienda) return undefined;
  return nombreTienda === 'E-Commerce' ? 'eMarket Perú' : nombreTienda;
};

const normalizeTema = (tema: any) => {
  if (!tema) return tema;
  return {
    ...tema,
    nombreTienda: normalizeNombreTienda(tema.nombreTienda) ?? tema.nombreTienda,
  };
};

export class ConfiguracionController {
  async getTemaPublico(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const config = await prisma.configuracion_sistema.findUnique({
        where: { clave: CLAVE_TEMA },
        select: { valor: true },
      });
      const tema = config ? normalizeTema({ ...temaDefault, ...JSON.parse(config.valor) }) : temaDefault;
      res.json({ success: true, data: tema });
    } catch (error) {
      next(error);
    }
  }

  async getTemaAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const config = await prisma.configuracion_sistema.findUnique({
        where: { clave: CLAVE_TEMA },
        select: { valor: true },
      });
      const tema = config ? normalizeTema({ ...temaDefault, ...JSON.parse(config.valor) }) : temaDefault;
      res.json({ success: true, data: tema });
    } catch (error) {
      next(error);
    }
  }

  async updateTema(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('No autenticado', 401);
      const data = temaSchema.parse(req.body);
      const normalizedData = {
        ...data,
        nombreTienda: normalizeNombreTienda(data.nombreTienda) ?? data.nombreTienda,
      };
      const saved = await prisma.configuracion_sistema.upsert({
        where: { clave: CLAVE_TEMA },
        update: { valor: JSON.stringify(normalizedData), descripcion: 'Colores y configuración del tema del sistema' },
        create: {
          clave: CLAVE_TEMA,
          valor: JSON.stringify(normalizedData),
          descripcion: 'Colores y configuración del tema del sistema',
        },
      });
      res.json({ success: true, message: 'Configuración guardada', data: JSON.parse(saved.valor) });
    } catch (error) {
      next(error);
    }
  }
}

