import { Request, Response, NextFunction } from 'express';
import { MercadoPagoService } from '../services/mercadopago.service';

export class MercadoPagoController {
  private mercadoPagoService = new MercadoPagoService();

  async createPreference(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const preference = await this.mercadoPagoService.createPaymentPreference(parseInt(orderId));
      res.json({ success: true, data: preference });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      await this.mercadoPagoService.handleWebhook(req.body);
      res.status(200).send();
    } catch (error) {
      next(error);
    }
  }
}
