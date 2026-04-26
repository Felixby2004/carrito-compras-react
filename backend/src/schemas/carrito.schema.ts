import { z } from 'zod';

export const addToCartSchema = z.object({
  producto_id: z.number().int().positive(),
  variante_id: z.number().int().positive().optional(),
  cantidad: z.number().int().min(1).max(999),
});

export const updateCartItemSchema = z.object({
  cantidad: z.number().int().min(0).max(999),
});

export const applyCouponSchema = z.object({
  codigo: z.string().min(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;