"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mercadopago_controller_1 = require("../controllers/mercadopago.controller");
const router = (0, express_1.Router)();
const mercadoPagoController = new mercadopago_controller_1.MercadoPagoController();
// Route to create payment preference
router.post('/preference/:orderId', mercadoPagoController.createPreference.bind(mercadoPagoController));
// Webhook for Mercado Pago
router.post('/webhook', mercadoPagoController.handleWebhook.bind(mercadoPagoController));
exports.default = router;
