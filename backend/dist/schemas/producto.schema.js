"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productoFilterSchema = exports.productoUpdateSchema = exports.productoSchema = void 0;
const zod_1 = require("zod");
exports.productoSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1, 'SKU requerido'),
    nombre: zod_1.z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
    descripcion_corta: zod_1.z.string().max(200).optional(),
    descripcion_larga: zod_1.z.string().optional(),
    categoria_id: zod_1.z.number().int().positive(),
    subcategoria_id: zod_1.z.number().int().positive().optional(),
    marca_id: zod_1.z.number().int().positive().optional(),
    unidad_medida_id: zod_1.z.number().int().positive(),
    precio_costo: zod_1.z.number().min(0),
    precio_venta: zod_1.z.number().min(0),
    precio_oferta: zod_1.z.number().min(0).optional(),
    fecha_inicio_oferta: zod_1.z.string().datetime().optional(),
    fecha_fin_oferta: zod_1.z.string().datetime().optional(),
    peso: zod_1.z.number().min(0).optional(),
    ancho: zod_1.z.number().min(0).optional(),
    alto: zod_1.z.number().min(0).optional(),
    profundidad: zod_1.z.number().min(0).optional(),
    estado: zod_1.z.enum(['activo', 'inactivo', 'borrador']).default('activo'),
    stock: zod_1.z.number().int().min(0).default(0),
    stock_minimo: zod_1.z.number().int().min(0).default(0),
});
exports.productoUpdateSchema = exports.productoSchema.partial().extend({
    stock: zod_1.z.number().int().min(0).optional(),
    stock_minimo: zod_1.z.number().int().min(0).optional(),
});
exports.productoFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    search: zod_1.z.string().optional(),
    categoria_id: zod_1.z.coerce.number().int().positive().optional(),
    subcategoria_id: zod_1.z.coerce.number().int().positive().optional(),
    marca_id: zod_1.z.coerce.number().int().positive().optional(),
    min_precio: zod_1.z.coerce.number().min(0).optional(),
    max_precio: zod_1.z.coerce.number().min(0).optional(),
    ordenar: zod_1.z.enum(['nombre_asc', 'nombre_desc', 'precio_asc', 'precio_desc', 'fecha_asc', 'fecha_desc', 'popularidad']).default('fecha_desc'),
    estado: zod_1.z.string().optional(), // ← Agrega esta línea
});
