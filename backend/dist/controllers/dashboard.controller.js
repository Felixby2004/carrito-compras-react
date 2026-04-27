"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DashboardController {
    toNumber(value) {
        return Number(value || 0);
    }
    normalizarEstado(estado) {
        const s = String(estado || '').toLowerCase().trim();
        if (s === 'entregado')
            return 'entregada';
        if (s === 'cancelado')
            return 'cancelada';
        return s;
    }
    monthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    // Obtener resumen general del dashboard
    async getResumenGeneral(req, res, next) {
        try {
            const [totalOrdenes, totalVentas, totalClientes, ventasHoy, ordenesPendientes, productosActivos, stockBajo] = await Promise.all([
                prisma.ord_ordenes.count(),
                prisma.ord_ordenes.aggregate({
                    where: { estado: { in: ['pagada', 'entregada', 'entregado'] } },
                    _sum: { total: true },
                }),
                prisma.cli_clientes.count(),
                prisma.ord_ordenes.aggregate({
                    where: {
                        created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                        estado: { in: ['pagada', 'entregada', 'entregado'] },
                    },
                    _sum: { total: true },
                }),
                prisma.ord_ordenes.count({
                    where: { estado: 'pendiente_pago' },
                }),
                prisma.cat_productos.count({
                    where: { activo: true },
                }),
                prisma.inv_stock_producto.count({
                    where: { stock_fisico: { lte: 10 } },
                }),
            ]);
            res.json({
                success: true,
                data: {
                    totalOrdenes,
                    totalVentas: totalVentas._sum.total ? parseFloat(totalVentas._sum.total.toString()) : 0,
                    totalClientes,
                    ventasHoy: ventasHoy._sum.total ? parseFloat(ventasHoy._sum.total.toString()) : 0,
                    ordenesPendientes,
                    productosActivos,
                    stockBajo,
                    ultimaActualizacion: new Date(),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtener datos de órdenes para gráficos
    async getEstadisticasOrdenes(req, res, next) {
        try {
            const { periodo = '7d' } = req.query;
            let fechaInicio = new Date();
            let label = 'Últimos 7 días';
            if (periodo === '30d') {
                fechaInicio.setDate(fechaInicio.getDate() - 30);
                label = 'Últimos 30 días';
            }
            else if (periodo === '12m') {
                fechaInicio.setMonth(fechaInicio.getMonth() - 12);
                label = 'Últimos 12 meses';
            }
            else {
                fechaInicio.setDate(fechaInicio.getDate() - 7);
            }
            const ordenesPorEstado = await prisma.ord_ordenes.groupBy({
                by: ['estado'],
                where: { created_at: { gte: fechaInicio } },
                _count: true,
            });
            // Generar datos de ventas diarias
            const ventasDiarias = [];
            const fechaActual = new Date(fechaInicio);
            while (fechaActual <= new Date()) {
                const inicio = new Date(fechaActual);
                const fin = new Date(fechaActual);
                fin.setDate(fin.getDate() + 1);
                const ventas = await prisma.ord_ordenes.aggregate({
                    where: {
                        created_at: { gte: inicio, lt: fin },
                        estado: { in: ['pagada', 'entregada', 'entregado'] },
                    },
                    _sum: { total: true },
                    _count: true,
                });
                ventasDiarias.push({
                    fecha: inicio.toISOString().split('T')[0],
                    ventas: ventas._sum.total ? parseFloat(ventas._sum.total.toString()) : 0,
                    ordenes: ventas._count || 0,
                });
                fechaActual.setDate(fechaActual.getDate() + 1);
            }
            res.json({
                success: true,
                data: {
                    periodo: label,
                    ordenesPorEstado,
                    ventasDiarias,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtener productos más vendidos
    async getProductosMasVendidos(req, res, next) {
        try {
            const { limite = 10 } = req.query;
            const productos = await prisma.cat_productos.findMany({
                where: { activo: true },
                select: {
                    id: true,
                    nombre: true,
                    sku: true,
                    precio_venta: true,
                    ventas_totales: true,
                    stock: {
                        select: {
                            stock_fisico: true,
                        },
                    },
                },
                orderBy: { ventas_totales: 'desc' },
                take: Number(limite),
            });
            res.json({
                success: true,
                data: productos.map(p => ({
                    ...p,
                    precio_venta: Number(p.precio_venta),
                    stock_disponible: p.stock?.stock_fisico || 0,
                })),
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtener estado del inventario
    async getEstadoInventario(req, res, next) {
        try {
            const [totalProductos, productosActivos, stockBajo, sinStock, valorInventario,] = await Promise.all([
                // Total de productos
                prisma.cat_productos.count(),
                // Productos activos
                prisma.cat_productos.count({
                    where: { activo: true },
                }),
                // Productos con stock bajo
                prisma.inv_stock_producto.count({
                    where: { stock_fisico: { gt: 0, lte: 10 } },
                }),
                // Productos sin stock
                prisma.inv_stock_producto.count({
                    where: { stock_fisico: { lte: 0 } },
                }),
                // Valor total del inventario
                prisma.cat_productos.aggregate({
                    where: { activo: true },
                    _sum: {
                        precio_costo: true,
                    },
                }),
            ]);
            res.json({
                success: true,
                data: {
                    totalProductos,
                    productosActivos,
                    stockBajo,
                    sinStock,
                    valorInventario: Number(valorInventario._sum.precio_costo) || 0,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtener movimientos recientes del inventario
    async getMovimientosInventario(req, res, next) {
        try {
            const { limite = 20 } = req.query;
            const movimientos = await prisma.inv_movimientos_inventario.findMany({
                include: {
                    producto: {
                        include: {
                            producto: true,
                        },
                    },
                },
                orderBy: { fecha_movimiento: 'desc' },
                take: Number(limite),
            });
            res.json({
                success: true,
                data: movimientos,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtener clientes recientes
    async getClientesRecientes(req, res, next) {
        try {
            const { limite = 10 } = req.query;
            const clientes = await prisma.cli_clientes.findMany({
                select: {
                    id: true,
                    usuario: {
                        select: {
                            email: true,
                        },
                    },
                    telefono: true,
                    total_gastado: true,
                    fecha_ultima_compra: true,
                    segmento: true,
                    created_at: true,
                },
                orderBy: { created_at: 'desc' },
                take: Number(limite),
            });
            res.json({
                success: true,
                data: clientes.map(c => ({
                    ...c,
                    total_gastado: Number(c.total_gastado),
                })),
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtener métricas de rendimiento
    async getMetricasRendimiento(req, res, next) {
        try {
            const mesActual = new Date();
            mesActual.setDate(1);
            mesActual.setHours(0, 0, 0, 0);
            const mesPasado = new Date(mesActual);
            mesPasado.setMonth(mesPasado.getMonth() - 1);
            const [ventasMesActual, ventasMesPasado, ordenesMesActual, ordenesMesPasado, ticketPromedio, tasaConversion,] = await Promise.all([
                // Ventas mes actual
                prisma.ord_ordenes.aggregate({
                    where: {
                        created_at: { gte: mesActual },
                        estado: { in: ['pagada', 'entregada', 'entregado'] },
                    },
                    _sum: { total: true },
                }),
                // Ventas mes pasado
                prisma.ord_ordenes.aggregate({
                    where: {
                        created_at: { gte: mesPasado, lt: mesActual },
                        estado: { in: ['pagada', 'entregada', 'entregado'] },
                    },
                    _sum: { total: true },
                }),
                // Órdenes mes actual
                prisma.ord_ordenes.count({
                    where: {
                        created_at: { gte: mesActual },
                        estado: { in: ['pagada', 'entregada', 'entregado'] },
                    },
                }),
                // Órdenes mes pasado
                prisma.ord_ordenes.count({
                    where: {
                        created_at: { gte: mesPasado, lt: mesActual },
                        estado: { in: ['pagada', 'entregada', 'entregado'] },
                    },
                }),
                // Ticket promedio
                prisma.ord_ordenes.aggregate({
                    where: {
                        estado: { in: ['pagada', 'entregada', 'entregado'] },
                    },
                    _avg: { total: true },
                }),
                // Tasa de conversión (órdenes pagadas vs totales)
                prisma.ord_ordenes.count({
                    where: {
                        created_at: { gte: mesActual },
                        estado: { in: ['pagada', 'entregada', 'entregado'] },
                    },
                }),
            ]);
            const totalOrdenesMesActual = await prisma.ord_ordenes.count({
                where: {
                    created_at: { gte: mesActual },
                },
            });
            const ventasActual = Number(ventasMesActual._sum.total) || 0;
            const ventasPasado = Number(ventasMesPasado._sum.total) || 0;
            const crecimiento = ventasPasado > 0
                ? ((ventasActual - ventasPasado) / ventasPasado) * 100
                : 0;
            res.json({
                success: true,
                data: {
                    ventasMesActual: ventasActual,
                    ventasMesPasado: ventasPasado,
                    crecimiento: Number(crecimiento.toFixed(2)),
                    ordenesMesActual,
                    ordenesMesPasado,
                    ticketPromedio: Number(ticketPromedio._avg.total || 0),
                    tasaConversion: totalOrdenesMesActual > 0
                        ? ((tasaConversion / totalOrdenesMesActual) * 100).toFixed(2)
                        : '0.00',
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAdvancedAnalytics(req, res, next) {
        try {
            const fechaHasta = req.query.fecha_hasta ? new Date(String(req.query.fecha_hasta)) : new Date();
            const fechaDesde = req.query.fecha_desde
                ? new Date(String(req.query.fecha_desde))
                : new Date(new Date().setDate(new Date().getDate() - 30));
            fechaDesde.setHours(0, 0, 0, 0);
            fechaHasta.setHours(23, 59, 59, 999);
            const ordenes = await prisma.ord_ordenes.findMany({
                where: { created_at: { gte: fechaDesde, lte: fechaHasta } },
                include: {
                    cliente: true,
                    items: {
                        include: {
                            producto: {
                                include: { categoria: true },
                            },
                        },
                    },
                },
                orderBy: { created_at: 'asc' },
            });
            const ordenesCompletadas = ordenes.filter((o) => ['pagada', 'enviada', 'entregada'].includes(this.normalizarEstado(o.estado)));
            const ordenesNoCanceladas = ordenes.filter((o) => !['cancelada', 'devuelta'].includes(o.estado));
            const carritosCreados = await prisma.ord_carritos.count({ where: { created_at: { gte: fechaDesde, lte: fechaHasta } } });
            const visitas = await prisma.cli_historial_navegacion.count({ where: { fecha_visita: { gte: fechaDesde, lte: fechaHasta } } });
            const clientesNuevos = await prisma.cli_clientes.count({ where: { created_at: { gte: fechaDesde, lte: fechaHasta } } });
            const pagosReembolso = await prisma.ord_pagos.findMany({
                where: {
                    metodo: 'reembolso',
                    created_at: { gte: fechaDesde, lte: fechaHasta },
                },
            });
            const stock = await prisma.inv_stock_producto.findMany({ include: { producto: { include: { categoria: true } } } });
            const ventasMonto = ordenesCompletadas.reduce((acc, o) => acc + this.toNumber(o.total), 0);
            const ticketPromedio = ordenesCompletadas.length ? ventasMonto / ordenesCompletadas.length : 0;
            const tasaConversion = visitas > 0 ? (ordenesCompletadas.length / visitas) * 100 : 0;
            const tasaAbandono = carritosCreados > 0 ? ((carritosCreados - ordenesNoCanceladas.length) / carritosCreados) * 100 : 0;
            const ordenesPendientes = ordenes.filter((o) => ['pendiente_pago', 'pagada', 'en_proceso'].includes(o.estado)).length;
            const reembolsosMonto = pagosReembolso.reduce((acc, p) => acc + this.toNumber(p.monto), 0);
            const categoriaMap = new Map();
            const productoCantidadMap = new Map();
            const estadoMap = new Map();
            const hourlyMap = new Map();
            const weekdayMap = new Map();
            const monthlyMap = new Map();
            const abandonmentByDay = new Map();
            const descuentoCorr = [];
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
            for (const orden of ordenes) {
                estadoMap.set(orden.estado, (estadoMap.get(orden.estado) || 0) + 1);
                const hour = String(new Date(orden.fecha_orden).getHours()).padStart(2, '0');
                hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + this.toNumber(orden.total));
                const dName = dayNames[new Date(orden.fecha_orden).getDay()];
                weekdayMap.set(dName, (weekdayMap.get(dName) || 0) + this.toNumber(orden.total));
                const dKey = new Date(orden.created_at).toISOString().split('T')[0];
                const day = abandonmentByDay.get(dKey) || { carritos: 0, ordenes: 0 };
                day.ordenes += 1;
                abandonmentByDay.set(dKey, day);
                const mKey = this.monthKey(new Date(orden.created_at));
                const month = monthlyMap.get(mKey) || { ingresos: 0, costos: 0, ordenes: 0 };
                month.ingresos += this.toNumber(orden.total);
                month.ordenes += 1;
                monthlyMap.set(mKey, month);
                let cantidadItems = 0;
                for (const item of orden.items) {
                    cantidadItems += item.cantidad;
                    const categoria = item.producto?.categoria?.nombre || 'Sin categoría';
                    categoriaMap.set(categoria, (categoriaMap.get(categoria) || 0) + this.toNumber(item.subtotal));
                    const pKey = `${item.producto_id}`;
                    const p = productoCantidadMap.get(pKey) || { nombre: item.nombre_producto, cantidad: 0, ingreso: 0, costo: 0 };
                    p.cantidad += item.cantidad;
                    p.ingreso += this.toNumber(item.subtotal);
                    p.costo += item.cantidad * this.toNumber(item.producto?.precio_costo);
                    productoCantidadMap.set(pKey, p);
                    month.costos += item.cantidad * this.toNumber(item.producto?.precio_costo);
                }
                monthlyMap.set(mKey, month);
                descuentoCorr.push({
                    descuento: this.toNumber(orden.descuento),
                    cantidad: cantidadItems,
                });
            }
            const carritos = await prisma.ord_carritos.findMany({
                where: { created_at: { gte: fechaDesde, lte: fechaHasta } },
                select: { created_at: true },
            });
            for (const carrito of carritos) {
                const dKey = new Date(carrito.created_at).toISOString().split('T')[0];
                const day = abandonmentByDay.get(dKey) || { carritos: 0, ordenes: 0 };
                day.carritos += 1;
                abandonmentByDay.set(dKey, day);
            }
            const ventasEvolucionDiaria = Array.from(abandonmentByDay.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([fecha, x]) => ({ fecha, ordenes: x.ordenes, carritos: x.carritos, abandono: x.carritos > 0 ? ((x.carritos - x.ordenes) / x.carritos) * 100 : 0 }));
            const ingresosPorCategoria = Array.from(categoriaMap.entries())
                .map(([categoria, monto]) => ({ categoria, monto }))
                .sort((a, b) => b.monto - a.monto)
                .slice(0, 5);
            const topProductos = Array.from(productoCantidadMap.values())
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 10);
            const monthlySeries = Array.from(monthlyMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([mes, v], idx, arr) => {
                const start = Math.max(0, idx - 2);
                const moving = arr.slice(start, idx + 1).map(([, m]) => m.ingresos);
                return {
                    mes,
                    ingresos: Number(v.ingresos.toFixed(2)),
                    costos: Number(v.costos.toFixed(2)),
                    ordenes: v.ordenes,
                    promedio_movil_3m: Number((moving.reduce((x, y) => x + y, 0) / moving.length).toFixed(2)),
                    regresion: Number((arr.length > 1 ? arr[0][1].ingresos + ((arr[arr.length - 1][1].ingresos - arr[0][1].ingresos) / (arr.length - 1)) * idx : v.ingresos).toFixed(2)),
                };
            });
            const forecast = monthlySeries.length
                ? Number((monthlySeries.slice(-3).reduce((acc, m) => acc + m.ingresos, 0) / Math.min(3, monthlySeries.length)).toFixed(2))
                : 0;
            const abcBase = Array.from(productoCantidadMap.values()).sort((a, b) => b.ingreso - a.ingreso);
            const totalIngresoProductos = abcBase.reduce((acc, p) => acc + p.ingreso, 0) || 1;
            let acumulado = 0;
            const abc = abcBase.map((p) => {
                acumulado += p.ingreso;
                const ratio = acumulado / totalIngresoProductos;
                const clase = ratio <= 0.8 ? 'A' : ratio <= 0.95 ? 'B' : 'C';
                return { ...p, porcentaje_acumulado: Number((ratio * 100).toFixed(2)), clase };
            });
            const clientesRfmBase = await prisma.cli_clientes.findMany({
                include: {
                    ordenes: {
                        where: { estado: { in: ['pagada', 'enviada', 'entregada'] } },
                        select: { created_at: true, total: true },
                    },
                    usuario: { select: { email: true } },
                },
            });
            const hoy = Date.now();
            const rfm = clientesRfmBase.map((c) => {
                const mont = c.ordenes.reduce((acc, o) => acc + this.toNumber(o.total), 0);
                const recency = c.ordenes.length ? Math.floor((hoy - new Date(c.ordenes[c.ordenes.length - 1].created_at).getTime()) / 86400000) : 999;
                return {
                    email: c.usuario.email,
                    segmento: c.segmento,
                    recency,
                    frequency: c.ordenes.length,
                    monetary: Number(mont.toFixed(2)),
                };
            });
            const cohortOrders = await prisma.ord_ordenes.findMany({
                where: { estado: { in: ['pagada', 'enviada', 'entregada'] } },
                select: { cliente_id: true, created_at: true },
                orderBy: { created_at: 'asc' },
            });
            const firstMonthByClient = new Map();
            const cohortMap = new Map();
            for (const o of cohortOrders) {
                const m = this.monthKey(new Date(o.created_at));
                if (!firstMonthByClient.has(o.cliente_id))
                    firstMonthByClient.set(o.cliente_id, m);
                const cohort = firstMonthByClient.get(o.cliente_id);
                const active = cohortMap.get(cohort) || new Map();
                active.set(m, (active.get(m) || 0) + 1);
                cohortMap.set(cohort, active);
            }
            const cohort = Array.from(cohortMap.entries()).map(([cohorte, activos]) => ({
                cohorte,
                retencion: Array.from(activos.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([mes, clientes]) => ({ mes, clientes })),
            }));
            const ticketPorSegmento = new Map();
            for (const o of ordenesCompletadas) {
                const seg = o.cliente.segmento || 'sin_segmento';
                const arr = ticketPorSegmento.get(seg) || [];
                arr.push(this.toNumber(o.total));
                ticketPorSegmento.set(seg, arr);
            }
            const boxPlot = Array.from(ticketPorSegmento.entries()).map(([segmento, valores]) => {
                const sorted = [...valores].sort((a, b) => a - b);
                const q = (p) => sorted[Math.floor((sorted.length - 1) * p)] || 0;
                return { segmento, min: q(0), q1: q(0.25), mediana: q(0.5), q3: q(0.75), max: q(1) };
            });
            res.json({
                success: true,
                data: {
                    filtros: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
                    kpis: {
                        ventas_totales_monto: Number(ventasMonto.toFixed(2)),
                        ventas_totales_ordenes: ordenesCompletadas.length,
                        ticket_promedio: Number(ticketPromedio.toFixed(2)),
                        tasa_conversion: Number(tasaConversion.toFixed(2)),
                        tasa_abandono_carrito: Number(tasaAbandono.toFixed(2)),
                        productos_agotados: stock.filter((s) => s.stock_fisico <= 0).length,
                        productos_stock_bajo: stock.filter((s) => s.stock_fisico > 0 && s.stock_fisico <= 10).length,
                        clientes_nuevos: clientesNuevos,
                        ordenes_pendientes: ordenesPendientes,
                        reembolsos_monto: Number(reembolsosMonto.toFixed(2)),
                        reembolsos_cantidad: pagosReembolso.length,
                    },
                    ingresos_por_categoria: ingresosPorCategoria,
                    ordenes_por_estado: Array.from(estadoMap.entries()).map(([estado, cantidad]) => ({ estado, cantidad })),
                    ventas_evolucion: ventasEvolucionDiaria,
                    ingresos_vs_costos_mensual: monthlySeries,
                    tendencia_abandono: ventasEvolucionDiaria,
                    top_productos: topProductos,
                    funnel: {
                        visitas,
                        carrito: carritosCreados,
                        checkout: ordenes.length,
                        pago: ordenesCompletadas.length,
                    },
                    estadisticas_descriptivas: {
                        ventas_mensuales: monthlySeries,
                        pronostico_siguiente_mes: forecast,
                        ventas_por_hora: Array.from(hourlyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([hora, total]) => ({ hora, total })),
                        ventas_por_dia_semana: Array.from(weekdayMap.entries()).map(([dia, total]) => ({ dia, total })),
                        abc_productos: abc.slice(0, 30),
                        rfm_clientes: rfm,
                        abandono_periodo: ventasEvolucionDiaria,
                        cohortes: cohort,
                        correlacion_descuento_volumen: descuentoCorr,
                        ticket_promedio_segmento_boxplot: boxPlot,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
