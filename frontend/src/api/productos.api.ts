import apiClient from './client';
import type { Producto } from '../types';

export interface ProductosFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoria_id?: number;
  min_precio?: number;
  max_precio?: number;
  ordenar?: string;
}

export interface ProductosResponse {
  success: boolean;
  data: Producto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productosApi = {
  getProductos: async (filters?: ProductosFilters): Promise<ProductosResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/productos?${params.toString()}`);
    return response.data;
  },
  
  getProductoById: async (id: number): Promise<Producto> => {
    const response = await apiClient.get(`/productos/${id}`);
    return response.data.data;
  },
  
  getDestacados: async (limit: number = 8): Promise<Producto[]> => {
    const response = await apiClient.get(`/productos/destacados?limit=${limit}`);
    return response.data.data;
  },
  
  getOfertas: async (limit: number = 8): Promise<Producto[]> => {
    const response = await apiClient.get(`/productos/ofertas?limit=${limit}`);
    return response.data.data;
  },
  
  getNuevos: async (limit: number = 8): Promise<Producto[]> => {
    const response = await apiClient.get(`/productos/nuevos?limit=${limit}`);
    return response.data.data;
  },
  
  getRelacionados: async (id: number, limit: number = 4): Promise<Producto[]> => {
    const response = await apiClient.get(`/productos/${id}/relacionados?limit=${limit}`);
    return response.data.data;
  },
};