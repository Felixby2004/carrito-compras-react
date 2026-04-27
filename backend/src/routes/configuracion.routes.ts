import { Router } from 'express';
import { ConfiguracionController } from '../controllers/configuracion.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();
const controller = new ConfiguracionController();

router.get('/publica/tema', controller.getTemaPublico.bind(controller));
router.get('/tema', authenticate, requirePermission('configuracion', 'leer'), controller.getTemaAdmin.bind(controller));
router.put('/tema', authenticate, requirePermission('configuracion', 'editar'), controller.updateTema.bind(controller));

export default router;

