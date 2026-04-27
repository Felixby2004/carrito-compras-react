import apiClient from './client';

export const wishlistApi = {
  getWishlist: () => apiClient.get('/wishlist'),
  addToWishlist: (productoId: number) =>
    apiClient.post('/wishlist', { producto_id: productoId }),
  removeFromWishlist: (productoId: number) =>
    apiClient.delete(`/wishlist/${productoId}`),
};
