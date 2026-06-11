import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Sparkles } from 'lucide-react';
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
      <div className="flex gap-6 bg-white/80 backdrop-blur-soft rounded-2xl shadow-soft-lg hover:shadow-glow transition-all duration-500 p-6 border border-white/50 hover:border-indigo-100 group">
        <div className="relative flex-shrink-0 overflow-hidden rounded-2xl shadow-soft">
          <img 
            src={imageError ? 'https://via.placeholder.com/160x160?text=Producto' : imagenPrincipal} 
            alt={producto.nombre} 
            className="w-40 h-40 object-cover transition-all duration-700 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          {tieneDescuento && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-black px-3 py-1 rounded-full shadow-lg animate-float">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                -{producto.descuento_porcentaje}%
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <Link to={`/producto/${producto.id}`}>
            <h3 className="font-extrabold text-xl text-slate-800 group-hover:text-indigo-600 transition-colors duration-300">{producto.nombre}</h3>
          </Link>
          <p className="text-slate-500 text-base mt-2">{producto.descripcion_corta}</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-black text-indigo-600">
              <Price value={precioActual} />
            </span>
            {tieneDescuento && (
              <>
                <span className="text-lg text-slate-400 line-through font-semibold">
                  <Price value={precioVenta} />
                </span>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                  Ahorras <Price value={precioVenta - precioActual} />
                </span>
              </>
            )}
          </div>
          <p className="text-sm mt-3">
            {sinStock ? (
              <span className="text-red-600 font-bold bg-red-100 px-3 py-1 rounded-full">Agotado</span>
            ) : (
              <span className="text-emerald-600 font-semibold bg-emerald-100 px-3 py-1 rounded-full">✓ Stock disponible: {stockDisponible} unidades</span>
            )}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleAddToCart}
              disabled={sinStock}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 shadow-soft ${
                sinStock
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-primary text-white hover:shadow-glow hover:scale-105 active:scale-95'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {sinStock ? 'Sin stock' : 'Agregar al carrito'}
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`p-3 rounded-xl border-2 transition-all duration-300 hover:scale-110 shadow-soft ${
                enWishlist 
                  ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50' 
                  : 'border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50'
              }`}
              title={enWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart
                className={`w-6 h-6 transition-all duration-300 ${
                  enWishlist ? 'text-rose-600 fill-rose-600 scale-110' : 'text-slate-400 hover:text-rose-600'
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
      className="bg-white/80 backdrop-blur-soft rounded-3xl shadow-soft-lg hover:shadow-glow transition-all duration-500 relative overflow-hidden group border border-white/50 hover:border-indigo-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Etiqueta de descuento */}
      {tieneDescuento && (
        <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white text-sm font-black px-4 py-2 rounded-full shadow-glow animate-float">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            -{producto.descuento_porcentaje}%
          </span>
        </div>
      )}

      {/* Botón corazón */}
      <button
        onClick={handleToggleWishlist}
        className={`absolute top-4 right-4 z-20 p-3 rounded-2xl shadow-glow transition-all duration-300 ${
          enWishlist 
            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white scale-110 animate-pulse-glow' 
            : 'bg-white/90 backdrop-blur-soft text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:scale-110'
        }`}
        title={enWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        <Heart className={`w-6 h-6 ${enWishlist ? 'fill-current' : ''}`} />
      </button>

      <Link to={`/producto/${producto.id}`} className="block">
        <div className="relative overflow-hidden rounded-t-3xl">
          <img 
            src={imageError ? 'https://via.placeholder.com/300x300?text=Producto' : imagenPrincipal} 
            alt={producto.nombre} 
            className="w-full h-64 object-cover transition-all duration-700 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay con botón de agregar al carrito en hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end justify-center pb-6 transition-all duration-500 ${
            isHovered && !sinStock ? 'opacity-100' : 'opacity-0'
          }`}>
            {!sinStock && (
              <button
                onClick={handleAddToCart}
                className="px-7 py-3.5 rounded-2xl font-bold text-white shadow-glow bg-gradient-primary transition-all duration-500 flex items-center gap-3 hover:scale-105 active:scale-95"
              >
                <ShoppingCart className="w-6 h-6" />
                Agregar al carrito
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-extrabold text-xl text-slate-800 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
            {producto.nombre}
          </h3>
          <p className="text-slate-500 text-base mt-2 line-clamp-2">{producto.descripcion_corta}</p>
          
          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-black text-indigo-600">
              <Price value={precioActual} />
            </span>
            {tieneDescuento && (
              <span className="text-lg text-slate-400 line-through font-semibold">
                <Price value={precioVenta} />
              </span>
            )}
          </div>
          
          <p className="text-sm mt-4">
            {sinStock ? (
              <span className="text-red-600 font-bold bg-red-100 px-4 py-2 rounded-full">Agotado</span>
            ) : (
              <span className="text-emerald-600 font-semibold bg-emerald-100 px-4 py-2 rounded-full">✓ Stock disponible: {stockDisponible}</span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
}
