import apiClient from './client';
import type { CarritoResponse, AddToCartRequest } from '../types';

export const carritoApi = {
  getCarrito: async (): Promise<CarritoResponse> => {
    const response = await apiClient.get('/carrito');
    return response.data.data;
  },
  
  addToCart: async (data: AddToCartRequest): Promise<CarritoResponse> => {
    const response = await apiClient.post('/carrito/items', data);
    return response.data.data;
  },
  
  updateCartItem: async (itemId: number, cantidad: number): Promise<CarritoResponse> => {
    const response = await apiClient.put(`/carrito/items/${itemId}`, { cantidad });
    return response.data.data;
  },
  
  removeCartItem: async (itemId: number): Promise<CarritoResponse> => {
    const response = await apiClient.delete(`/carrito/items/${itemId}`);
    return response.data.data;
  },
  
  clearCart: async (): Promise<CarritoResponse> => {
    const response = await apiClient.delete('/carrito');
    return response.data.data;
  },
  
  mergeCart: async (sessionId: string): Promise<CarritoResponse> => {
    const response = await apiClient.post('/carrito/merge', { sessionId });
    return response.data.data;
  },
};