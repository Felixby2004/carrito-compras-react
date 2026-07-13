"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductoService = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const prisma = new client_1.PrismaClient();
class ProductoService {
    async getProductoById(id) {
        const producto = await prisma.cat_productos.findFirst({
            where: { id: id, activo: true },
            include: {
                categoria: true,
                subcategoria: true,
                marca: true,
                unidad_medida: true,
                imagenes: { orderBy: { orden: 'asc' } },
                stock: true,
            },
        });
        if (!producto) {
            throw new errorHandler_1.AppError('Producto no encontrado', 404);
        }
        const ahora = new Date();
        const precioVenta = Number(producto.precio_venta);
        const precioOferta = producto.precio_oferta ? Number(producto.precio_oferta) : null;
        const tieneOferta = precioOferta !== null &&
            producto.fecha_inicio_oferta &&
            producto.fecha_fin_oferta &&
            new Date(producto.fecha_inicio_oferta) <= ahora &&
            new Date(producto.fecha_fin_oferta) >= ahora;
        const precioActual = tieneOferta ? precioOferta : precioVenta;
        const descuentoPorcentaje = tieneOferta && precioVenta > 0
            ? Math.round(((precioVenta - precioOferta) / precioVenta) * 100)
            : 0;
        const stockDisponible = producto.stock ?
            Number(producto.stock.stock_fisico) - (Number(producto.stock.stock_reservado) || 0) : 0;
        return {
            ...producto,
            precio_venta: precioVenta,
            precio_oferta: precioOferta,
            precio_actual: precioActual, // ← Asegura que esto existe
            descuento_porcentaje: descuentoPorcentaje,
            stock_disponible: stockDisponible,
        };
    }
    async getProductos(filters) {
        const { page, limit, search, categoria_id, subcategoria_id, marca_id, min_precio, max_precio, ordenar, estado } = filters;
        const where = {
            activo: true,
        };
        if (estado === 'todos') {
            // No filtrar
        }
        else if (estado) {
            where.estado = estado;
        }
        else {
            where.estado = 'activo';
        }
        if (search && search.trim()) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { descripcion_corta: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (categoria_id)
            where.categoria_id = categoria_id;
        if (subcategoria_id)
            where.subcategoria_id = subcategoria_id;
        if (marca_id)
            where.marca_id = marca_id;
        // First get all matching products (without price filtering or pagination yet)
        const data = await prisma.cat_productos.findMany({
            where,
            include: {
                categoria: true,
                subcategoria: true,
                marca: true,
                unidad_medida: true,
                imagenes: true,
                stock: true,
            },
        });
        const ahora = new Date();
        let productosFiltrados = data.map((producto) => {
            const precioVenta = Number(producto.precio_venta);
            const precioOferta = producto.precio_oferta ? Number(producto.precio_oferta) : null;
            const tieneOferta = precioOferta !== null &&
                producto.fecha_inicio_oferta &&
                producto.fecha_fin_oferta &&
                new Date(producto.fecha_inicio_oferta) <= ahora &&
                new Date(producto.fecha_fin_oferta) >= ahora;
            const precioActual = tieneOferta ? precioOferta : precioVenta;
            const descuentoPorcentaje = tieneOferta && precioVenta > 0
                ? Math.round(((precioVenta - precioOferta) / precioVenta) * 100)
                : 0;
            const stockDisponible = producto.stock ?
                Number(producto.stock.stock_fisico) - (Number(producto.stock.stock_reservado) || 0) : 0;
            return {
                ...producto,
                precio_venta: precioVenta,
                precio_oferta: precioOferta,
                precio_actual: precioActual,
                descuento_porcentaje: descuentoPorcentaje,
                stock_disponible: stockDisponible,
            };
        });
        // Apply price range filters
        if (min_precio !== undefined) {
            productosFiltrados = productosFiltrados.filter(p => p.precio_actual >= min_precio);
        }
        if (max_precio !== undefined) {
            productosFiltrados = productosFiltrados.filter(p => p.precio_actual <= max_precio);
        }
        // Apply sorting
        switch (ordenar) {
            case 'nombre_asc':
                productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
            case 'nombre_desc':
                productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
                break;
            case 'precio_asc':
                productosFiltrados.sort((a, b) => a.precio_actual - b.precio_actual);
                break;
            case 'precio_desc':
                productosFiltrados.sort((a, b) => b.precio_actual - a.precio_actual);
                break;
            case 'fecha_asc':
                productosFiltrados.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'popularidad':
                productosFiltrados.sort((a, b) => (b.ventas_totales || 0) - (a.ventas_totales || 0));
                break;
            default: productosFiltrados.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        // Apply pagination
        const skip = (page - 1) * limit;
        const total = productosFiltrados.length;
        const dataPagina = productosFiltrados.slice(skip, skip + limit);
        return {
            data: dataPagina,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async createProducto(data, usuarioId) {
        const existingSku = await prisma.cat_productos.findFirst({
            where: { sku: data.sku },
        });
        if (existingSku) {
            throw new errorHandler_1.AppError('El SKU ya existe', 409);
        }
        const producto = await prisma.cat_productos.create({
            data: {
                sku: data.sku,
                nombre: data.nombre,
                descripcion_corta: data.descripcion_corta,
                descripcion_larga: data.descripcion_larga,
                categoria_id: data.categoria_id,
                subcategoria_id: data.subcategoria_id,
                marca_id: data.marca_id,
                unidad_medida_id: data.unidad_medida_id,
                precio_costo: data.precio_costo,
                precio_venta: data.precio_venta,
                precio_oferta: data.precio_oferta,
                fecha_inicio_oferta: data.fecha_inicio_oferta ? new Date(data.fecha_inicio_oferta) : undefined,
                fecha_fin_oferta: data.fecha_fin_oferta ? new Date(data.fecha_fin_oferta) : undefined,
                peso: data.peso,
                ancho: data.ancho,
                alto: data.alto,
                profundidad: data.profundidad,
                estado: data.estado,
                created_by: usuarioId,
            },
        });
        await prisma.inv_stock_producto.create({
            data: {
                producto_id: producto.id,
                stock_fisico: data.stock || 0,
                stock_reservado: 0,
                stock_minimo: data.stock_minimo || 0,
            },
        });
        return producto;
    }
    async updateProducto(id, data, usuarioId) {
        const producto = await prisma.cat_productos.findFirst({
            where: { id: id },
        });
        if (!producto) {
            throw new errorHandler_1.AppError('Producto no encontrado', 404);
        }
        if (data.sku && data.sku !== producto.sku) {
            const existingSku = await prisma.cat_productos.findFirst({
                where: { sku: data.sku },
            });
            if (existingSku) {
                throw new errorHandler_1.AppError('El SKU ya existe', 409);
            }
        }
        const updatedProducto = await prisma.cat_productos.update({
            where: { id },
            data: {
                sku: data.sku,
                nombre: data.nombre,
                descripcion_corta: data.descripcion_corta,
                descripcion_larga: data.descripcion_larga,
                categoria_id: data.categoria_id,
                subcategoria_id: data.subcategoria_id,
                marca_id: data.marca_id,
                unidad_medida_id: data.unidad_medida_id,
                precio_costo: data.precio_costo,
                precio_venta: data.precio_venta,
                precio_oferta: data.precio_oferta,
                fecha_inicio_oferta: data.fecha_inicio_oferta ? new Date(data.fecha_inicio_oferta) : undefined,
                fecha_fin_oferta: data.fecha_fin_oferta ? new Date(data.fecha_fin_oferta) : undefined,
                peso: data.peso,
                ancho: data.ancho,
                alto: data.alto,
                profundidad: data.profundidad,
                estado: data.estado,
                updated_by: usuarioId,
            },
        });
        const stockExistente = await prisma.inv_stock_producto.findFirst({
            where: { producto_id: id },
        });
        if (stockExistente) {
            const updateData = {};
            if (data.stock !== undefined)
                updateData.stock_fisico = data.stock;
            if (data.stock_minimo !== undefined)
                updateData.stock_minimo = data.stock_minimo;
            if (Object.keys(updateData).length > 0) {
                await prisma.inv_stock_producto.update({
                    where: { producto_id: id },
                    data: updateData,
                });
            }
        }
        else if (data.stock !== undefined) {
            await prisma.inv_stock_producto.create({
                data: {
                    producto_id: id,
                    stock_fisico: data.stock,
                    stock_reservado: 0,
                    stock_minimo: data.stock_minimo || 0,
                },
            });
        }
        return updatedProducto;
    }
    async deleteProducto(id, usuarioId) {
        const producto = await prisma.cat_productos.findFirst({
            where: { id: id },
        });
        if (!producto) {
            throw new errorHandler_1.AppError('Producto no encontrado', 404);
        }
        await prisma.cat_productos.update({
            where: { id },
            data: { activo: false },
        });
        return { success: true };
    }
    async getProductosDestacados(limit = 8) {
        const data = await prisma.cat_productos.findMany({
            where: {
                activo: true,
                estado: 'activo',
            },
            take: limit,
            include: {
                imagenes: { where: { es_principal: true }, take: 1 },
                stock: true,
            },
        });
        const ahora = new Date();
        return data.map((producto) => {
            const precioVenta = Number(producto.precio_venta);
            const precioOferta = producto.precio_oferta ? Number(producto.precio_oferta) : null;
            const tieneOferta = precioOferta !== null &&
                producto.fecha_inicio_oferta &&
                producto.fecha_fin_oferta &&
                new Date(producto.fecha_inicio_oferta) <= ahora &&
                new Date(producto.fecha_fin_oferta) >= ahora;
            const precioActual = tieneOferta ? precioOferta : precioVenta;
            const descuentoPorcentaje = tieneOferta && precioVenta > 0
                ? Math.round(((precioVenta - precioOferta) / precioVenta) * 100)
                : 0;
            const stockDisponible = producto.stock ?
                Number(producto.stock.stock_fisico) - (Number(producto.stock.stock_reservado) || 0) : 0;
            return {
                ...producto,
                precio_venta: precioVenta,
                precio_oferta: precioOferta,
                precio_actual: precioActual,
                descuento_porcentaje: descuentoPorcentaje,
                stock_disponible: stockDisponible,
            };
        });
    }
    async getProductosOfertas(limit = 8) {
        const ahora = new Date();
        const data = await prisma.cat_productos.findMany({
            where: {
                activo: true,
                estado: 'activo',
                precio_oferta: { not: null },
                fecha_inicio_oferta: { lte: ahora },
                fecha_fin_oferta: { gte: ahora },
            },
            take: limit,
            include: {
                imagenes: { where: { es_principal: true }, take: 1 },
                stock: true,
            },
        });
        return data.map((producto) => {
            const precioVenta = Number(producto.precio_venta);
            const precioOferta = producto.precio_oferta ? Number(producto.precio_oferta) : null;
            const tieneOferta = precioOferta !== null &&
                producto.fecha_inicio_oferta &&
                producto.fecha_fin_oferta &&
                new Date(producto.fecha_inicio_oferta) <= ahora &&
                new Date(producto.fecha_fin_oferta) >= ahora;
            const precioActual = tieneOferta ? precioOferta : precioVenta;
            const descuentoPorcentaje = tieneOferta && precioVenta > 0
                ? Math.round(((precioVenta - precioOferta) / precioVenta) * 100)
                : 0;
            const stockDisponible = producto.stock ?
                Number(producto.stock.stock_fisico) - (Number(producto.stock.stock_reservado) || 0) : 0;
            return {
                ...producto,
                precio_venta: precioVenta,
                precio_oferta: precioOferta,
                precio_actual: precioActual,
                descuento_porcentaje: descuentoPorcentaje,
                stock_disponible: stockDisponible,
            };
        });
    }
    async getProductosNuevos(limit = 8) {
        const data = await prisma.cat_productos.findMany({
            where: { activo: true, estado: 'activo' },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                imagenes: { where: { es_principal: true }, take: 1 },
                stock: true,
            },
        });
        const ahora = new Date();
        return data.map((producto) => {
            const precioVenta = Number(producto.precio_venta);
            const precioOferta = producto.precio_oferta ? Number(producto.precio_oferta) : null;
            const tieneOferta = precioOferta !== null &&
                producto.fecha_inicio_oferta &&
                producto.fecha_fin_oferta &&
                new Date(producto.fecha_inicio_oferta) <= ahora &&
                new Date(producto.fecha_fin_oferta) >= ahora;
            const precioActual = tieneOferta ? precioOferta : precioVenta;
            const descuentoPorcentaje = tieneOferta && precioVenta > 0
                ? Math.round(((precioVenta - precioOferta) / precioVenta) * 100)
                : 0;
            const stockDisponible = producto.stock ?
                Number(producto.stock.stock_fisico) - (Number(producto.stock.stock_reservado) || 0) : 0;
            return {
                ...producto,
                precio_venta: precioVenta,
                precio_oferta: precioOferta,
                precio_actual: precioActual,
                descuento_porcentaje: descuentoPorcentaje,
                stock_disponible: stockDisponible,
            };
        });
    }
    async getProductosRelacionados(productoId, limit = 4) {
        const producto = await prisma.cat_productos.findFirst({
            where: { id: productoId },
        });
        if (!producto)
            return [];
        const data = await prisma.cat_productos.findMany({
            where: {
                activo: true,
                estado: 'activo',
                categoria_id: producto.categoria_id,
                id: { not: productoId },
            },
            take: limit,
            include: {
                imagenes: { where: { es_principal: true }, take: 1 },
                stock: true,
            },
        });
        const ahora = new Date();
        return data.map((prod) => {
            const precioVenta = Number(prod.precio_venta);
            const precioOferta = prod.precio_oferta ? Number(prod.precio_oferta) : null;
            const tieneOferta = precioOferta !== null &&
                prod.fecha_inicio_oferta &&
                prod.fecha_fin_oferta &&
                new Date(prod.fecha_inicio_oferta) <= ahora &&
                new Date(prod.fecha_fin_oferta) >= ahora;
            const precioActual = tieneOferta ? precioOferta : precioVenta;
            const descuentoPorcentaje = tieneOferta && precioVenta > 0
                ? Math.round(((precioVenta - precioOferta) / precioVenta) * 100)
                : 0;
            const stockDisponible = prod.stock ?
                Number(prod.stock.stock_fisico) - (Number(prod.stock.stock_reservado) || 0) : 0;
            return {
                ...prod,
                precio_venta: precioVenta,
                precio_oferta: precioOferta,
                precio_actual: precioActual,
                descuento_porcentaje: descuentoPorcentaje,
                stock_disponible: stockDisponible,
            };
        });
    }
    async getCategorias() {
        return prisma.cat_categorias.findMany({
            where: { activo: true },
            select: { id: true, nombre: true },
            orderBy: { nombre: 'asc' },
        });
    }
    async getSubcategorias() {
        return prisma.cat_subcategorias.findMany({
            where: { activo: true },
            select: { id: true, nombre: true, categoria_id: true },
            orderBy: { nombre: 'asc' },
        });
    }
    async getMarcas() {
        return prisma.cat_marcas.findMany({
            where: { activo: true },
            select: { id: true, nombre: true },
            orderBy: { nombre: 'asc' },
        });
    }
    async getUnidadesMedida() {
        return prisma.cat_unidades_medida.findMany({
            select: { id: true, nombre: true, abreviatura: true },
            orderBy: { nombre: 'asc' },
        });
    }
    async getAtributos() {
        return prisma.cat_atributos.findMany({
            include: {
                valores: true,
            },
            orderBy: { nombre: 'asc' },
        });
    }
}
exports.ProductoService = ProductoService;
