import { Router } from 'express';
import { ReporteController } from '../controllers/reporte.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new ReporteController();

router.use(authenticate);
router.get('/operacional/:reporte', controller.reporteOperacional.bind(controller));
router.get('/operacional/factura/:ordenId', controller.facturaIndividual.bind(controller));
router.get('/operacional/comprobante/:ordenId', controller.comprobanteSimplificado.bind(controller));

export default router;
