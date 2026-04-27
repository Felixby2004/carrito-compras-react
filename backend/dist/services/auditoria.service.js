"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AuditoriaService {
    /**
     * Registra una acción en la tabla de auditoría
     */
    async registrarAccion(params) {
        try {
            // No registrar en auditoría si faltan datos críticos
            if (!params.accion || !params.modulo || !params.tabla) {
                console.warn('Intento de auditoría con parámetros incompletos:', params);
                return;
            }
            await prisma.auditoria_registro.create({
                data: {
                    usuario_id: params.usuario_id,
                    accion: params.accion,
                    modulo: params.modulo,
                    tabla: params.tabla,
                    registro_id: params.registro_id,
                    datos_anteriores: params.datos_anteriores ? JSON.stringify(params.datos_anteriores) : null,
                    datos_nuevos: params.datos_nuevos ? JSON.stringify(params.datos_nuevos) : null,
                    ip: params.ip || 'desconocida',
                    timestamp: new Date(),
                },
            });
        }
        catch (error) {
            console.error('Error registrando auditoría:', error);
            // No lanzar excepción para no interrumpir el flujo de la aplicación
        }
    }
    /**
     * Registra un login
     */
    async registrarLogin(usuario_id, ip, exitoso, razon_fallo) {
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
        }
        catch (error) {
            console.error('Error registrando login en auditoría:', error);
        }
    }
    /**
     * Registra un logout
     */
    async registrarLogout(usuario_id, ip) {
        try {
            await this.registrarAccion({
                usuario_id,
                accion: 'logout',
                modulo: 'auth',
                tabla: 'seg_usuarios',
                registro_id: usuario_id,
                ip,
            });
        }
        catch (error) {
            console.error('Error registrando logout en auditoría:', error);
        }
    }
    /**
     * Registra cambio de estado de orden
     */
    async registrarCambioEstadoOrden(usuario_id, orden_id, estado_anterior, estado_nuevo, ip) {
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
        }
        catch (error) {
            console.error('Error registrando cambio de estado en auditoría:', error);
        }
    }
    /**
     * Registra creación de registro
     */
    async registrarCreacion(usuario_id, modulo, tabla, registro_id, datos, ip) {
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
        }
        catch (error) {
            console.error('Error registrando creación en auditoría:', error);
        }
    }
    /**
     * Registra edición de registro
     */
    async registrarEdicion(usuario_id, modulo, tabla, registro_id, datos_anteriores, datos_nuevos, ip) {
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
        }
        catch (error) {
            console.error('Error registrando edición en auditoría:', error);
        }
    }
    /**
     * Registra eliminación de registro
     */
    async registrarEliminacion(usuario_id, modulo, tabla, registro_id, datos, ip) {
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
        }
        catch (error) {
            console.error('Error registrando eliminación en auditoría:', error);
        }
    }
    /**
     * Obtiene registros de auditoría con filtros
     */
    async obtenerRegistros(filtros) {
        try {
            const pagina = filtros?.pagina || 1;
            const limite = filtros?.limite || 50;
            const skip = (pagina - 1) * limite;
            const where = {};
            if (filtros?.usuario_id)
                where.usuario_id = filtros.usuario_id;
            if (filtros?.accion)
                where.accion = filtros.accion;
            if (filtros?.modulo)
                where.modulo = filtros.modulo;
            if (filtros?.tabla)
                where.tabla = filtros.tabla;
            if (filtros?.desde || filtros?.hasta) {
                where.timestamp = {};
                if (filtros?.desde)
                    where.timestamp.gte = filtros.desde;
                if (filtros?.hasta)
                    where.timestamp.lte = filtros.hasta;
            }
            const [registros, total] = await Promise.all([
                prisma.auditoria_registro.findMany({
                    where,
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                    skip,
                    take: limite,
                    orderBy: { timestamp: 'desc' },
                }),
                prisma.auditoria_registro.count({ where }),
            ]);
            return {
                registros,
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            };
        }
        catch (error) {
            console.error('Error obteniendo registros de auditoría:', error);
            throw error;
        }
    }
    /**
     * Obtiene actividad de un usuario
     */
    async obtenerActividadUsuario(usuario_id, pagina = 1, limite = 50) {
        try {
            const skip = (pagina - 1) * limite;
            const [registros, total] = await Promise.all([
                prisma.auditoria_registro.findMany({
                    where: { usuario_id },
                    skip,
                    take: limite,
                    orderBy: { timestamp: 'desc' },
                }),
                prisma.auditoria_registro.count({ where: { usuario_id } }),
            ]);
            return {
                registros,
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
            };
        }
        catch (error) {
            console.error('Error obteniendo actividad del usuario:', error);
            throw error;
        }
    }
}
exports.AuditoriaService = AuditoriaService;
exports.default = new AuditoriaService();
