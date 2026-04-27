import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth.api';
import { setAccessToken } from '../api/client';
import type { Usuario, LoginRequest, RegisterRequest } from '../types';
import { useCartStore } from './cartStore';

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<Usuario>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (data: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(data);
          const { user, accessToken, refreshToken } = response.data;
          
          setAccessToken(accessToken);
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Sincronizar carrito
          const cartStore = useCartStore.getState();
          const pendingCart = cartStore.getPendingCart();
          
          if (pendingCart && pendingCart.items.length > 0) {
            // Si hay carrito pendiente, agregar cada item
            for (const item of pendingCart.items) {
              try {
                await cartStore.addItem(item.producto_id, item.cantidad);
              } catch (error) {
                console.error('Error agregando item:', error);
              }
            }
          } else {
            // Si no, cargar carrito del backend
            await cartStore.loadCart();
          }
          
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
          await authApi.register(data);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch (error) {
          console.error('Error en logout:', error);
        } finally {
          setAccessToken(null);
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      
      checkAuth: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          get().clearAuth();
          return;
        }
        
        try {
          const response = await authApi.refreshToken(refreshToken);
          const { user, accessToken, refreshToken: newRefreshToken } = response.data;
          
          setAccessToken(accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          get().clearAuth();
        }
      },
      
      clearAuth: () => {
        setAccessToken(null);
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);