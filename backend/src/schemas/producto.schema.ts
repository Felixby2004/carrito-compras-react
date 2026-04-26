import { z } from 'zod';

export const productoSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  descripcion_corta: z.string().max(200).optional(),
  descripcion_larga: z.string().optional(),
  categoria_id: z.number().int().positive(),
  subcategoria_id: z.number().int().positive().optional(),
  marca_id: z.number().int().positive().optional(),
  unidad_medida_id: z.number().int().positive(),
  precio_costo: z.number().min(0),
  precio_venta: z.number().min(0),
  precio_oferta: z.number().min(0).optional(),
  fecha_inicio_oferta: z.string().datetime().optional(),
  fecha_fin_oferta: z.string().datetime().optional(),
  peso: z.number().min(0).optional(),
  ancho: z.number().min(0).optional(),
  alto: z.number().min(0).optional(),
  profundidad: z.number().min(0).optional(),
  estado: z.enum(['activo', 'inactivo', 'borrador']).default('activo'),
  stock: z.number().int().min(0).default(0),
  stock_minimo: z.number().int().min(0).default(0),
});

export const productoUpdateSchema = productoSchema.partial().extend({
  stock: z.number().int().min(0).optional(),
  stock_minimo: z.number().int().min(0).optional(),
});

export const productoFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoria_id: z.coerce.number().int().positive().optional(),
  subcategoria_id: z.coerce.number().int().positive().optional(),
  marca_id: z.coerce.number().int().positive().optional(),
  min_precio: z.coerce.number().min(0).optional(),
  max_precio: z.coerce.number().min(0).optional(),
  ordenar: z.enum(['nombre_asc', 'nombre_desc', 'precio_asc', 'precio_desc', 'fecha_asc', 'fecha_desc', 'popularidad']).default('fecha_desc'),
  estado: z.string().optional(), // ← Agrega esta línea
});

export type ProductoFilterInput = z.infer<typeof productoFilterSchema>;
export type ProductoInput = z.infer<typeof productoSchema>;
export type ProductoUpdateInput = z.infer<typeof productoUpdateSchema>;