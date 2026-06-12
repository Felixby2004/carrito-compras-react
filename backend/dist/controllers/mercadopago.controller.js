"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoController = void 0;
const mercadopago_service_1 = require("../services/mercadopago.service");
class MercadoPagoController {
    constructor() {
        this.mercadoPagoService = new mercadopago_service_1.MercadoPagoService();
    }
    async createPreference(req, res, next) {
        try {
            const { orderId } = req.params;
            const preference = await this.mercadoPagoService.createPaymentPreference(parseInt(orderId));
            res.json({ success: true, data: preference });
        }
        catch (error) {
            next(error);
        }
    }
    async handleWebhook(req, res, next) {
        try {
            await this.mercadoPagoService.handleWebhook(req.body);
            res.status(200).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MercadoPagoController = MercadoPagoController;
