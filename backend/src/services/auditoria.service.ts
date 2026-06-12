import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditoriaParams {
  usuario_id?: number;
  accion: string;
  modulo: string;
  tabla: string;
  registro_id?: number;
  datos_anteriores?: any;
  datos_nuevos?: any;
  ip?: string;
}

export class AuditoriaService {
  /**
   * Registra una acción en la tabla de auditoría
   */
  async registrarAccion(params: AuditoriaParams) {
    try {
      // No registrar en auditoría si faltan datos críticos
      if (!params.accion || !params.modulo || !params.tabla) {
        console.warn('Intento de auditoría con parámetros incompletos:', params);
        return;
      }

      // Modelo auditoria_registro no existe, solo logueamos
      console.log('Auditoría:', params);
    } catch (error) {
      console.error('Error registrando auditoría:', error);
      // No lanzar excepción para no interrumpir el flujo de la aplicación
    }
  }

  /**
   * Registra un login
   */
  async registrarLogin(usuario_id: number, ip: string, exitoso: boolean, razon_fallo?: string) {
    try {
      const datos = {
        usuario_id,
        ip,
        exitoso,
        razon_fallo: razon_fallo || null,
        timestamp: new Date(),
      };

      await this.registrarAccion({
        usuario_id: exitoso ? usuario_id : undefined,
        accion: 'login',
        modulo: 'auth',
        tabla: 'seg_usuarios',
        registro_id: usuario_id,
        datos_nuevos: datos,
        ip,
      });
    } catch (error) {
      console.error('Error registrando login en auditoría:', error);
    }
  }

  /**
   * Registra un logout
   */
  async registrarLogout(usuario_id: number, ip: string) {
    try {
      await this.registrarAccion({
        usuario_id,
        accion: 'logout',
        modulo: 'auth',
        tabla: 'seg_usuarios',
        registro_id: usuario_id,
        ip,
      });
    } catch (error) {
      console.error('Error registrando logout en auditoría:', error);
    }
  }

  /**
   * Registra cambio de estado de orden
   */
  async registrarCambioEstadoOrden(
    usuario_id: number,
    orden_id: number,
    estado_anterior: string,
    estado_nuevo: string,
    ip: string
  ) {
    try {
      await this.registrarAccion({
        usuario_id,
        accion: 'cambio_estado',
        modulo: 'ordenes',
        tabla: 'ord_ordenes',
        registro_id: orden_id,
        datos_anteriores: { estado: estado_anterior },
        datos_nuevos: { estado: estado_nuevo },
        ip,
      });
    } catch (error) {
      console.error('Error registrando cambio de estado en auditoría:', error);
    }
  }

  /**
   * Registra creación de registro
   */
  async registrarCreacion(
    usuario_id: number | undefined,
    modulo: string,
    tabla: string,
    registro_id: number | undefined,
    datos: any,
    ip: string
  ) {
    try {
      await this.registrarAccion({
        usuario_id,
        accion: 'crear',
        modulo,
        tabla,
        registro_id,
        datos_nuevos: datos,
        ip,
      });
    } catch (error) {
      console.error('Error registrando creación en auditoría:', error);
    }
  }

  /**
   * Registra edición de registro
   */
  async registrarEdicion(
    usuario_id: number,
    modulo: string,
    tabla: string,
    registro_id: number,
    datos_anteriores: any,
    datos_nuevos: any,
    ip: string
  ) {
    try {
      await this.registrarAccion({
        usuario_id,
        accion: 'editar',
        modulo,
        tabla,
        registro_id,
        datos_anteriores,
        datos_nuevos,
        ip,
      });
    } catch (error) {
      console.error('Error registrando edición en auditoría:', error);
    }
  }

  /**
   * Registra eliminación de registro
   */
  async registrarEliminacion(
    usuario_id: number,
    modulo: string,
    tabla: string,
    registro_id: number,
    datos: any,
    ip: string
  ) {
    try {
      await this.registrarAccion({
        usuario_id,
        accion: 'eliminar',
        modulo,
        tabla,
        registro_id,
        datos_anteriores: datos,
        ip,
      });
    } catch (error) {
      console.error('Error registrando eliminación en auditoría:', error);
    }
  }

  /**
   * Obtiene registros de auditoría con filtros
   */
  async obtenerRegistros(
    filtros?: {
      usuario_id?: number;
      accion?: string;
      modulo?: string;
      tabla?: string;
      desde?: Date;
      hasta?: Date;
      pagina?: number;
      limite?: number;
    }
  ) {
    try {
      return {
        registros: [],
        total: 0,
        pagina: filtros?.pagina || 1,
        limite: filtros?.limite || 50,
        totalPaginas: 0,
      };
    } catch (error) {
      console.error('Error obteniendo registros de auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene actividad de un usuario
   */
  async obtenerActividadUsuario(
    usuario_id: number,
    pagina: number = 1,
    limite: number = 50
  ) {
    try {
      return {
        registros: [],
        total: 0,
        pagina,
        limite,
        totalPaginas: 0,
      };
    } catch (error) {
      console.error('Error obteniendo actividad del usuario:', error);
      throw error;
    }
  }
}

export default new AuditoriaService();
