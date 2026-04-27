// Tipos de usuario y autenticación
export interface Usuario {
  id: number;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: Usuario;
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirmacion: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

// Tipos de productos
export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion_corta: string;
  descripcion_larga?: string;
  categoria_id: number;
  subcategoria_id?: number;
  marca_id?: number;
  precio_costo?: number;
  precio_venta: number;
  precio_oferta?: number;
  fecha_inicio_oferta?: string;
  fecha_fin_oferta?: string;
  precio_actual: number;
  descuento_porcentaje: number;
  stock_disponible: number;
  peso?: number;
  ancho?: number;
  alto?: number;
  profundidad?: number;
  estado: string;
  activo?: boolean;
  popularidad?: number;
  imagenes: ProductoImagen[];
  categoria?: { id: number; nombre: string };
  marca?: { id: number; nombre: string };
  subcategoria?: { id: number; nombre: string };
  producto_atributos?: any[];
  stock?: {  // ← Relación con la tabla inv_stock_producto
    stock_fisico: number;
    stock_reservado: number;
    stock_minimo: number;
  };
}

export interface ProductoImagen {
  id: number;
  url: string;
  es_principal: boolean;
}

// Tipos de carrito
export interface AddToCartRequest {
  producto_id: number;
  variante_id?: number;
  cantidad: number;
}

export interface ItemCarrito {
  id: number;
  producto_id: number;
  nombre: string;
  imagen?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  stock_disponible?: number;
}

export interface CarritoResponse {
  id: number;
  items: ItemCarrito[];
  subtotal: number;
  impuesto: number;
  total: number;
}