import { Router } from 'express';
import { ResenaController } from '../controllers/resena.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const resenaController = new ResenaController();

router.get('/producto/:productoId', resenaController.getResenasByProducto.bind(resenaController));
router.post('/', authenticate, resenaController.createResena.bind(resenaController));

export default router;