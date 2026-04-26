import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const wishlistController = new WishlistController();

router.get('/', authenticate, wishlistController.getWishlist.bind(wishlistController));
router.post('/', authenticate, wishlistController.addToWishlist.bind(wishlistController));
router.delete('/:productoId', authenticate, wishlistController.removeFromWishlist.bind(wishlistController));

export default router;