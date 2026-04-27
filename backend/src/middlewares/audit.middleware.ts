import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import auditService from '../services/auditoria.service';

/**
 * Middleware que envuelve una acción para registrar auditoría
 * Usa un parámetro especial en locals para indicar qué registrar
 */
export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Almacenar información original para comparar después
  const originalSend = res.send;

  res.send = function (data: any) {
    // Si la respuesta es exitosa y contiene datos, registrar auditoría
    if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.auditAction) {
      const { accion, modulo, tabla, registro_id, datos_anteriores, datos_nuevos } = res.locals.auditAction;
      const ip = req.ip || req.connection.remoteAddress || 'desconocida';
      const usuario_id = (req as AuthRequest).user?.id;

      // No esperar a que se complete la auditoría
      auditService.registrarAccion({
        usuario_id,
        accion,
        modulo,
        tabla,
        registro_id,
        datos_anteriores,
        datos_nuevos,
        ip,
      }).catch(err => console.error('Error en auditoría:', err));
    }

    // Llamar al método original
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Helper para registrar auditoría desde controladores
 * Uso en controladores: res.locals.auditAction = crearAuditAction(...)
 */
export const crearAuditAction = (
  accion: 'crear' | 'editar' | 'eliminar' | 'cambio_estado',
  modulo: string,
  tabla: string,
  registro_id?: number,
  datos_anteriores?: any,
  datos_nuevos?: any
) => {
  return {
    accion,
    modulo,
    tabla,
    registro_id,
    datos_anteriores,
    datos_nuevos,
  };
};
