import apiClient from './client';

export interface Cupon {
  id: number;
  codigo: string;
  tipo: 'porcentaje' | 'fijo';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  monto_minimo: number | null;
  usos_maximos: number | null;
  usos_actuales: number;
  activo: boolean;
}

export const cuponApi = {
  validarCupon: async (codigo: string, subtotal: number) => {
    const response = await apiClient.post('/cupones/validar', { codigo, subtotal });
    return response.data;
  },
  
  getCupones: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/cupones?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  crearCupon: async (data: Partial<Cupon>) => {
    const response = await apiClient.post('/cupones', data);
    return response.data;
  },
  
  actualizarCupon: async (id: number, data: Partial<Cupon>) => {
    const response = await apiClient.put(`/cupones/${id}`, data);
    return response.data;
  },
  
  eliminarCupon: async (id: number) => {
    const response = await apiClient.delete(`/cupones/${id}`);
    return response.data;
  },
};