import { Router } from 'express';
import { CarritoController } from '../controllers/carrito.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const carritoController = new CarritoController();

router.get('/', carritoController.getCarrito.bind(carritoController));
router.post('/items', carritoController.addToCart.bind(carritoController));
router.put('/items/:itemId', carritoController.updateCartItem.bind(carritoController));
router.delete('/items/:itemId', carritoController.removeCartItem.bind(carritoController));
router.delete('/', carritoController.clearCart.bind(carritoController));

// Solo el merge requiere autenticación
router.post('/merge', authenticate, carritoController.mergeCart.bind(carritoController));

export default router;