import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Producto } from '../../types';
import { useProductoStore } from '../../stores/productoStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useAuthStore } from '../../stores/authStore';
import { notify } from '../../utils/notify';
import { Price } from '../Price';
import { fixImageUrl } from '../../utils/images';
import { useState } from 'react';

interface ProductCardProps {
  producto: Producto;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (producto: Producto) => Promise<void>;
}

export function ProductCard({ producto, viewMode = 'grid', onAddToCart }: ProductCardProps) {
  const getPrecio = useProductoStore((state) => state.getPrecio);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const precioActualizado = getPrecio(producto.id, producto.precio_actual);
  const precioVentaActualizado = getPrecio(producto.id, producto.precio_venta);

  const precioActual = precioActualizado;
  const tieneDescuento = (producto.descuento_porcentaje || 0) > 0 && precioVentaActualizado !== precioActual;

  const precioVenta = typeof producto.precio_venta === 'number'
    ? producto.precio_venta
    : Number(producto.precio_venta) || 0;

  const imagenPrincipal = fixImageUrl(producto.imagenes?.[0]?.url);
  const stockDisponible = typeof producto.stock_disponible === 'number'
    ? producto.stock_disponible
    : Number(producto.stock_disponible) || 0;
  const sinStock = stockDisponible <= 0;

  // Wishlist
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const enWishlist = isInWishlist(producto.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sinStock) {
      notify('Producto agotado', 'error');
      return;
    }
    if (onAddToCart) {
      await onAddToCart(producto);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      notify('Inicia sesión para guardar favoritos', 'info');
      return;
    }
    toggleWishlist(producto.id, producto.nombre);
  };

  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 border border-gray-100">
        <div className="relative flex-shrink-0 overflow-hidden rounded-lg">
          <img 
            src={imageError ? 'https://via.placeholder.com/128x128?text=Producto' : imagenPrincipal} 
            alt={producto.nombre} 
            className="w-32 h-32 object-cover transition-transform duration-300 hover:scale-110"
            onError={() => setImageError(true)}
          />
        </div>
        <div className="flex-1">
          <Link to={`/producto/${producto.id}`}>
            <h3 className="font-semibold text-lg hover:text-[var(--color-primary)] transition-colors">{producto.nombre}</h3>
          </Link>
          <p className="text-gray-600 text-sm mt-1">{producto.descripcion_corta}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}><Price value={precioActual} /></span>
            {tieneDescuento && (
              <>
                <span className="text-sm text-gray-400 line-through"><Price value={precioVenta} /></span>
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">-{producto.descuento_porcentaje}%</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {sinStock ? (
              <span className="text-red-600 font-medium">Agotado</span>
            ) : (
              <span className="text-green-600">Stock: {stockDisponible} unidades</span>
            )}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              disabled={sinStock}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sinStock
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'text-white hover:scale-105 active:scale-95'
              }`}
              style={{ backgroundColor: sinStock ? undefined : 'var(--color-primary)' }}
            >
              <ShoppingCart className="w-4 h-4" />
              {sinStock ? 'Sin stock' : 'Agregar al carrito'}
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-lg border transition-all duration-200 hover:scale-110 ${
                enWishlist 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200 hover:border-red-200 hover:bg-red-50'
              }`}
              title={enWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart
                className={`w-5 h-5 transition-colors duration-200 ${
                  enWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Etiqueta de descuento */}
      {tieneDescuento && (
        <div className="absolute top-3 left-3 z-20 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          -{producto.descuento_porcentaje}%
        </div>
      )}

      {/* Botón corazón */}
      <button
        onClick={handleToggleWishlist}
        className={`absolute top-3 right-3 z-20 p-2 rounded-full shadow-md transition-all duration-300 ${
          enWishlist 
            ? 'bg-red-500 text-white scale-110' 
            : 'bg-white text-gray-500 hover:bg-red-50 hover:text-red-500'
        }`}
        title={enWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        <Heart className={`w-5 h-5 ${enWishlist ? 'fill-current' : ''}`} />
      </button>

      <Link to={`/producto/${producto.id}`} className="block">
        <div className="relative overflow-hidden">
          <img 
            src={imageError ? 'https://via.placeholder.com/256x256?text=Producto' : imagenPrincipal} 
            alt={producto.nombre} 
            className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay con botón de agregar al carrito en hover */}
          <div className={`absolute inset-0 bg-black bg-opacity-0 flex items-center justify-center transition-all duration-300 ${
            isHovered && !sinStock ? 'bg-opacity-30' : ''
          }`}>
            {!sinStock && (
              <button
                onClick={handleAddToCart}
                className={`px-5 py-2.5 rounded-lg font-medium text-white shadow-lg transition-all duration-300 flex items-center gap-2 ${
                  isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <ShoppingCart className="w-5 h-5" />
                Agregar al carrito
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg hover:text-[var(--color-primary)] transition-colors line-clamp-2">
            {producto.nombre}
          </h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{producto.descripcion_corta}</p>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
              <Price value={precioActual} />
            </span>
            {tieneDescuento && (
              <span className="text-sm text-gray-400 line-through">
                <Price value={precioVenta} />
              </span>
            )}
          </div>
          
          <p className="text-xs mt-2">
            {sinStock ? (
              <span className="text-red-600 font-medium">Agotado</span>
            ) : (
              <span className="text-green-600">✓ Stock disponible: {stockDisponible}</span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
}