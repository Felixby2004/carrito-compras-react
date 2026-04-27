import { create } from 'zustand';

interface ProductoStore {
  precios: Map<number, number>;
  actualizarPrecio: (productoId: number, nuevoPrecio: number) => void;
  getPrecio: (productoId: number, precioDefault: number) => number;
}

export const useProductoStore = create<ProductoStore>((set, get) => ({
  precios: new Map(),
  
  actualizarPrecio: (productoId: number, nuevoPrecio: number) => {
    const { precios } = get();
    precios.set(productoId, nuevoPrecio);
    set({ precios: new Map(precios) });
  },
  
  getPrecio: (productoId: number, precioDefault: number) => {
    const { precios } = get();
    return precios.get(productoId) ?? precioDefault;
  },
}));