import { Router } from 'express';
import { CarritoController } from '../controllers/carrito.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();
const carritoController = new CarritoController();

router.get('/', optionalAuthenticate, carritoController.getCarrito.bind(carritoController));
router.post('/items', optionalAuthenticate, carritoController.addToCart.bind(carritoController));
router.put('/items/:itemId', optionalAuthenticate, carritoController.updateCartItem.bind(carritoController));
router.delete('/items/:itemId', optionalAuthenticate, carritoController.removeCartItem.bind(carritoController));
router.delete('/', optionalAuthenticate, carritoController.clearCart.bind(carritoController));

// Solo el merge requiere autenticación
router.post('/merge', authenticate, carritoController.mergeCart.bind(carritoController));

export default router;