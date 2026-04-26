import apiClient from './client';
import type { CarritoResponse, Producto, AddToCartRequest } from '../types';

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  productos?: Producto[];
}

export interface Marca {
  id: number;
  nombre: string;
}

export interface Subcategoria {
  id: number;
  nombre: string;
  slug: string;
  categoria_id: number;
}

export interface Atributo {
  id: number;
  nombre: string;
  valores: { id: number; valor: string }[];
}

export const catalogoApi = {
  // Obtener categorías con productos destacados
  getCategoriasConProductos: async (): Promise<Categoria[]> => {
    const response = await apiClient.get('/productos/categorias/con-productos');
    return response.data.data;
  },
  
  // Obtener todas las categorías
  getCategorias: async (): Promise<Categoria[]> => {
    const response = await apiClient.get('/productos/categorias');
    return response.data.data;
  },
  
  // Obtener todas las marcas
  getMarcas: async (): Promise<Marca[]> => {
    const response = await apiClient.get('/productos/marcas');
    return response.data.data;
  },
  
  // Búsqueda fuzzy
  buscarProductos: async (termino: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/productos/buscar?q=${encodeURIComponent(termino)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  getSubcategorias: async (categoriaId?: number): Promise<Subcategoria[]> => {
    const url = categoriaId 
      ? `/productos/subcategorias?categoriaId=${categoriaId}`
      : '/productos/subcategorias';
    const response = await apiClient.get(url);
    return response.data.data;
  },
  
  getAtributos: async (): Promise<Atributo[]> => {
    const response = await apiClient.get('/productos/atributos');
    return response.data.data;
  },

  buscarFuzzy: async (termino: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/productos/buscar-fuzzy?q=${encodeURIComponent(termino)}&page=${page}&limit=${limit}`);
    return response.data;
  },
}

export const carritoApi = {
  getCarrito: async (sessionId?: string): Promise<CarritoResponse> => {
    const headers: Record<string, string> = {};
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }
    const response = await apiClient.get('/carrito', { headers });
    return response.data.data;
  },
  
  addToCart: async (sessionId: string | undefined, data: AddToCartRequest): Promise<CarritoResponse> => {
    const headers: Record<string, string> = {};
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }
    const response = await apiClient.post('/carrito/items', data, { headers });
    return response.data.data;
  },
  
  updateCartItem: async (sessionId: string | undefined, itemId: number, cantidad: number): Promise<CarritoResponse> => {
    const headers: Record<string, string> = {};
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }
    const response = await apiClient.put(`/carrito/items/${itemId}`, { cantidad }, { headers });
    return response.data.data;
  },
  
  removeCartItem: async (sessionId: string | undefined, itemId: number): Promise<CarritoResponse> => {
    const headers: Record<string, string> = {};
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }
    const response = await apiClient.delete(`/carrito/items/${itemId}`, { headers });
    return response.data.data;
  },
  
  clearCart: async (sessionId: string | undefined): Promise<CarritoResponse> => {
    const headers: Record<string, string> = {};
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }
    const response = await apiClient.delete('/carrito', { headers });
    return response.data.data;
  },
  
  mergeCart: async (sessionId: string): Promise<CarritoResponse> => {
    const response = await apiClient.post('/carrito/merge', { sessionId });
    return response.data.data;
  },
};