import { MercadoPagoConfig, Preference } from 'mercadopago';
import config from '../config';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();
console.log('Mercado Pago Token loaded:', config.mercadoPagoToken ? 'Yes' : 'No'); // Log if token is loaded
const client = config.mercadoPagoToken ? new MercadoPagoConfig({ accessToken: config.mercadoPagoToken }) : null;

export class MercadoPagoService {
  async createPaymentPreference(orderId: number) {
    console.log('createPaymentPreference called for order ID:', orderId);
    
    if (!client) {
      throw new AppError('Mercado Pago no está configurado', 500);
    }

    const order = await prisma.ord_ordenes.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Pedido no encontrado', 404);
    }

    console.log('Order found:', { orderId: order.id, total: order.total, itemsCount: order.items.length });

    const items = order.items.map((item: any) => ({
      id: item.producto_id.toString(),
      title: item.nombre_producto,
      quantity: item.cantidad,
      unit_price: Number(item.precio_unitario),
      currency_id: 'PEN',
    }));

    console.log('Mercado Pago items:', items);

    const preference = new Preference(client);

    try {
      const result = await preference.create({
        body: {
          items,
          external_reference: order.id.toString(),
          back_urls: {
            success: `${config.frontendUrl}/checkout/success?orderId=${order.id}`,
            failure: `${config.frontendUrl}/checkout/failure?orderId=${order.id}`,
            pending: `${config.frontendUrl}/checkout/pending?orderId=${order.id}`,
          },
          auto_return: 'approved',
        },
      });

      console.log('Mercado Pago preference created successfully:', { id: result.id, init_point: result.init_point });
      return result;
    } catch (error: any) {
      console.error('Error creating Mercado Pago preference:', error.response ? error.response.data : error.message);
      throw new AppError('Error al crear la preferencia de pago de Mercado Pago: ' + (error.response?.data?.message || error.message), 500);
    }
  }

  async handleWebhook(data: any) {
    const { type, data: webhookData } = data;

    if (type === 'payment') {
      const paymentId = webhookData.id;

      // We need to fetch the payment details from Mercado Pago
      // because the webhook data only has the ID
      const { Payment } = await import('mercadopago');
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const orderId = parseInt(payment.external_reference);
      const paymentStatus = payment.status;

      // Update order and payment status in our database
      await this.updateOrderStatus(orderId, paymentStatus, paymentId.toString());
    }

    return { success: true };
  }

  private async updateOrderStatus(
    orderId: number,
    paymentStatus: string,
    transactionId: string
  ) {
    let estadoPago: 'pendiente' | 'completado' | 'rechazado' | 'vencido' = 'pendiente';
    let estadoOrden: 'pendiente_pago' | 'pagada' | 'cancelada' = 'pendiente_pago';

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
      } else {
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
