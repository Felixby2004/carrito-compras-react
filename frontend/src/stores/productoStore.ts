import { create } from 'zustand';

interface ProductoStore {
  precios: Map<number, number>;
  stock: Map<number, { stockFisico: number; stockReservado: number; stockDisponible: number }>;
  actualizarPrecio: (productoId: number, nuevoPrecio: number) => void;
  getPrecio: (productoId: number, precioDefault: number) => number;
  actualizarStock: (productoId: number, stockFisico: number, stockReservado: number, stockDisponible: number) => void;
  getStock: (productoId: number, stockDefault: { stockFisico: number; stockReservado: number; stockDisponible: number }) => { stockFisico: number; stockReservado: number; stockDisponible: number };
}

export const useProductoStore = create<ProductoStore>((set, get) => ({
  precios: new Map(),
  stock: new Map(),
  
  actualizarPrecio: (productoId: number, nuevoPrecio: number) => {
    const { precios } = get();
    precios.set(productoId, nuevoPrecio);
    set({ precios: new Map(precios) });
  },
  
  getPrecio: (productoId: number, precioDefault: number) => {
    const { precios } = get();
    return precios.get(productoId) ?? precioDefault;
  },

  actualizarStock: (productoId: number, stockFisico: number, stockReservado: number, stockDisponible: number) => {
    const { stock } = get();
    stock.set(productoId, { stockFisico, stockReservado, stockDisponible });
    set({ stock: new Map(stock) });
  },

  getStock: (productoId: number, stockDefault: { stockFisico: number; stockReservado: number; stockDisponible: number }) => {
    const { stock } = get();
    return stock.get(productoId) ?? stockDefault;
  },
}));