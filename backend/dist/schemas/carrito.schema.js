"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCouponSchema = exports.updateCartItemSchema = exports.addToCartSchema = void 0;
const zod_1 = require("zod");
exports.addToCartSchema = zod_1.z.object({
    producto_id: zod_1.z.number().int().positive(),
    variante_id: zod_1.z.number().int().positive().optional(),
    cantidad: zod_1.z.number().int().min(1).max(999),
});
exports.updateCartItemSchema = zod_1.z.object({
    cantidad: zod_1.z.number().int().min(0).max(999),
});
exports.applyCouponSchema = zod_1.z.object({
    codigo: zod_1.z.string().min(1),
});
