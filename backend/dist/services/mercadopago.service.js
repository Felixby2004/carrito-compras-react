"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoService = void 0;
const mercadopago_1 = require("mercadopago");
const config_1 = __importDefault(require("../config"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const prisma = new client_1.PrismaClient();
console.log('Mercado Pago Token loaded:', config_1.default.mercadoPagoToken ? 'Yes' : 'No'); // Log if token is loaded
const client = config_1.default.mercadoPagoToken ? new mercadopago_1.MercadoPagoConfig({ accessToken: config_1.default.mercadoPagoToken }) : null;
class MercadoPagoService {
    async createPaymentPreference(orderId) {
        console.log('createPaymentPreference called for order ID:', orderId);
        if (!client) {
            throw new errorHandler_1.AppError('Mercado Pago no está configurado', 500);
        }
        const order = await prisma.ord_ordenes.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) {
            throw new errorHandler_1.AppError('Pedido no encontrado', 404);
        }
        console.log('Order found:', { orderId: order.id, total: order.total, itemsCount: order.items.length });
        const items = order.items.map((item) => ({
            id: item.producto_id.toString(),
            title: item.nombre_producto,
            quantity: item.cantidad,
            unit_price: Number(item.precio_unitario),
            currency_id: 'PEN',
        }));
        console.log('Mercado Pago items:', items);
        const preference = new mercadopago_1.Preference(client);
        try {
            const result = await preference.create({
                body: {
                    items,
                    external_reference: order.id.toString(),
                    back_urls: {
                        success: `${config_1.default.frontendUrl}/checkout/success?orderId=${order.id}`,
                        failure: `${config_1.default.frontendUrl}/checkout/failure?orderId=${order.id}`,
                        pending: `${config_1.default.frontendUrl}/checkout/pending?orderId=${order.id}`,
                    },
                    auto_return: 'approved',
                },
            });
            console.log('Mercado Pago preference created successfully:', { id: result.id, init_point: result.init_point });
            return result;
        }
        catch (error) {
            console.error('Error creating Mercado Pago preference:', error.response ? error.response.data : error.message);
            throw new errorHandler_1.AppError('Error al crear la preferencia de pago de Mercado Pago: ' + (error.response?.data?.message || error.message), 500);
        }
    }
    async handleWebhook(data) {
        const { type, data: webhookData } = data;
        if (type === 'payment') {
            const paymentId = webhookData.id;
            // We need to fetch the payment details from Mercado Pago
            // because the webhook data only has the ID
            const { Payment } = await Promise.resolve().then(() => __importStar(require('mercadopago')));
            const paymentClient = new Payment(client);
            const payment = await paymentClient.get({ id: paymentId });
            const orderId = parseInt(payment.external_reference);
            const paymentStatus = payment.status;
            // Update order and payment status in our database
            await this.updateOrderStatus(orderId, paymentStatus, paymentId.toString());
        }
        return { success: true };
    }
    async updateOrderStatus(orderId, paymentStatus, transactionId) {
        let estadoPago = 'pendiente';
        let estadoOrden = 'pendiente_pago';
        switch (paymentStatus) {
            case 'approved':
                estadoPago = 'completado';
                estadoOrden = 'pagada';
                break;
            case 'rejected':
            case 'cancelled':
                estadoPago = 'rechazado';
                estadoOrden = 'cancelada';
                break;
            case 'expired':
                estadoPago = 'vencido';
                estadoOrden = 'cancelada';
                break;
            case 'pending':
            case 'in_process':
                estadoPago = 'pendiente';
                estadoOrden = 'pendiente_pago';
                break;
        }
        await prisma.$transaction(async (tx) => {
            // Update order status
            await tx.ord_ordenes.update({
                where: { id: orderId },
                data: { estado: estadoOrden },
            });
            // Update payment status or create if not exists
            const existingPayment = await tx.ord_pagos.findFirst({
                where: { orden_id: orderId, metodo: 'mercadopago' },
            });
            if (existingPayment) {
                await tx.ord_pagos.update({
                    where: { id: existingPayment.id },
                    data: {
                        estado_pago: estadoPago,
                        fecha_pago: estadoPago === 'completado' ? new Date() : null,
                        transaccion_id: transactionId,
                    },
                });
            }
            else {
                const order = await tx.ord_ordenes.findUnique({ where: { id: orderId } });
                if (order) {
                    await tx.ord_pagos.create({
                        data: {
                            orden_id: orderId,
                            monto: order.total,
                            metodo: 'mercadopago',
                            estado_pago: estadoPago,
                            fecha_pago: estadoPago === 'completado' ? new Date() : null,
                            transaccion_id: transactionId,
                        },
                    });
                }
            }
            // Record status history
            await tx.ord_historial_estados.create({
                data: {
                    orden_id: orderId,
                    estado_nuevo: estadoOrden,
                    comentario: `Estado de pago Mercado Pago: ${paymentStatus}`,
                },
            });
            // If payment is completed, update stock and customer stats
            if (estadoPago === 'completado') {
                const items = await tx.ord_items_orden.findMany({ where: { orden_id: orderId } });
                for (const item of items) {
                    await tx.inv_stock_producto.updateMany({
                        where: { producto_id: item.producto_id },
                        data: { stock_fisico: { decrement: item.cantidad } },
                    });
                    await tx.cat_productos.update({
                        where: { id: item.producto_id },
                        data: { ventas_totales: { increment: item.cantidad } },
                    });
                }
                const order = await tx.ord_ordenes.findUnique({ where: { id: orderId } });
                if (order) {
                    await tx.cli_clientes.update({
                        where: { id: order.cliente_id },
                        data: {
                            total_gastado: { increment: order.total },
                            fecha_ultima_compra: new Date(),
                        },
                    });
                }
            }
        });
    }
}
exports.MercadoPagoService = MercadoPagoService;
