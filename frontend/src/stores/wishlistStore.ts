import { create } from 'zustand';
import { wishlistApi } from '../api/wishlist.api';
import { notify } from '../utils/notify';

interface WishlistState {
  items: number[]; // IDs de productos
  isLoading: boolean;
  isInWishlist: (productoId: number) => boolean;
  loadWishlist: () => Promise<void>;
  toggleWishlist: (productoId: number, nombreProducto?: string) => Promise<void>;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,

  isInWishlist: (productoId: number) => get().items.includes(productoId),

  loadWishlist: async () => {
    try {
      set({ isLoading: true });
      const res = await wishlistApi.getWishlist();
      const data = res.data?.data || res.data || [];
      // El backend devuelve objetos con producto_id o id
      const ids = data.map((item: any) => item.producto_id || item.producto?.id || item.id).filter(Boolean);
      set({ items: ids });
    } catch (error) {
      console.error('Error cargando wishlist:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleWishlist: async (productoId: number, nombreProducto?: string) => {
    const { items } = get();
    const inWishlist = items.includes(productoId);

    // Optimistic update
    if (inWishlist) {
      set({ items: items.filter((id) => id !== productoId) });
    } else {
      set({ items: [...items, productoId] });
    }

    try {
      if (inWishlist) {
        await wishlistApi.removeFromWishlist(productoId);
        notify(nombreProducto ? `"${nombreProducto}" quitado de favoritos` : 'Quitado de favoritos', 'info');
      } else {
        await wishlistApi.addToWishlist(productoId);
        notify(nombreProducto ? `"${nombreProducto}" añadido a favoritos` : 'Añadido a favoritos', 'success');
      }
    } catch (error: any) {
      // Revertir optimistic update
      if (inWishlist) {
        set({ items: [...get().items, productoId] });
      } else {
        set({ items: get().items.filter((id) => id !== productoId) });
      }
      notify(error.response?.data?.message || 'Error al actualizar favoritos', 'error');
    }
  },

  clearWishlist: () => set({ items: [] }),
}));
