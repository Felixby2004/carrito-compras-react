import { Router } from 'express';
import { MercadoPagoController } from '../controllers/mercadopago.controller';

const router = Router();
const mercadoPagoController = new MercadoPagoController();

// Route to create payment preference
router.post('/preference/:orderId', mercadoPagoController.createPreference.bind(mercadoPagoController));

// Webhook for Mercado Pago
router.post('/webhook', mercadoPagoController.handleWebhook.bind(mercadoPagoController));

export default router;
