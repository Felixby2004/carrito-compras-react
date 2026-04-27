import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { carritoApi } from '../api/carrito.api';
import type { ItemCarrito, CarritoResponse } from '../types';
import { notify } from '../utils/notify';

interface CartState {
  items: ItemCarrito[];
  subtotal: number;
  impuesto: number;
  total: number;
  isLoading: boolean;
  cartId: number | null;
  
  loadCart: () => Promise<void>;
  addItem: (productoId: number, cantidad: number, varianteId?: number) => Promise<void>;
  updateItem: (itemId: number, cantidad: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithBackend: (usuarioId: number) => Promise<void>;
  setLocalCart: (cart: CarritoResponse) => void;
  resetCart: () => void;
  saveLocalCartBeforeLogin: () => void;  // ← Agrega
  getPendingCart: () => any; 
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      impuesto: 0,
      total: 0,
      isLoading: false,
      cartId: null,

      saveLocalCartBeforeLogin: () => {
        const { items, subtotal, total } = get();
        localStorage.setItem('pendingCart', JSON.stringify({ items, subtotal, total }));
      },

      getPendingCart: () => {
        const pending = localStorage.getItem('pendingCart');
        if (pending) {
          localStorage.removeItem('pendingCart');
          return JSON.parse(pending);
        }
        return null;
      },
      
      loadCart: async () => {
        set({ isLoading: true });
        try {
          const cart = await carritoApi.getCarrito();
          set({
            items: cart.items,
            subtotal: cart.subtotal,
            impuesto: cart.impuesto,
            total: cart.total,
            cartId: cart.id,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error cargando carrito:', error);
          set({ isLoading: false });
        }
      },
      
      addItem: async (productoId: number, cantidad: number, varianteId?: number) => {
        set({ isLoading: true });
        try {
          const cart = await carritoApi.addToCart({ 
            producto_id: productoId, 
            cantidad, 
            variante_id: varianteId 
          });
          set({
            items: cart.items,
            subtotal: cart.subtotal,
            impuesto: cart.impuesto,
            total: cart.total,
            cartId: cart.id,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Error agregando item:', error);
          const mensaje = error.response?.data?.message || 'Error al agregar al carrito';
          notify(mensaje, 'error');
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateItem: async (itemId: number, cantidad: number) => {
        set({ isLoading: true });
        try {
          // Primero actualizar en el backend
          const cart = await carritoApi.updateCartItem(itemId, cantidad);
          // Luego actualizar el estado local con la respuesta del backend
          set({
            items: cart.items,
            subtotal: cart.subtotal,
            impuesto: cart.impuesto,
            total: cart.total,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Error actualizando item:', error);
          const mensaje = error.response?.data?.message || 'Error al actualizar cantidad';
          notify(mensaje, 'error');
          set({ isLoading: false });
          throw error;
        }
      },
      
      removeItem: async (itemId: number) => {
        set({ isLoading: true });
        try {
          // Eliminar del backend
          const cart = await carritoApi.removeCartItem(itemId);
          // Actualizar el estado local con la respuesta del backend
          set({
            items: cart.items,
            subtotal: cart.subtotal,
            impuesto: cart.impuesto,
            total: cart.total,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Error removiendo item:', error);
          const mensaje = error.response?.data?.message || 'Error al eliminar producto';
          notify(mensaje, 'error');
          set({ isLoading: false });
          throw error;
        }
      },
      
      clearCart: async () => {
        set({ isLoading: true });
        try {
          const cart = await carritoApi.clearCart();
          set({
            items: cart.items,
            subtotal: cart.subtotal,
            impuesto: cart.impuesto,
            total: cart.total,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error limpiando carrito:', error);
          set({ isLoading: false });
        }
      },
      
      syncWithBackend: async (_usuarioId: number) => {
        await get().loadCart();
      },
      
      setLocalCart: (cart: CarritoResponse) => {
        set({
          items: cart.items,
          subtotal: cart.subtotal,
          impuesto: cart.impuesto,
          total: cart.total,
          cartId: cart.id,
        });
      },
      
      resetCart: () => {
        set({
          items: [],
          subtotal: 0,
          impuesto: 0,
          total: 0,
          cartId: null,
        });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        items: state.items, 
        subtotal: state.subtotal, 
        total: state.total,
      }),
    }
  )
);