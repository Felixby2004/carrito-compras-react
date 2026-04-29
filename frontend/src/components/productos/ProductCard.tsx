import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Producto } from '../../types';
import { useProductoStore } from '../../stores/productoStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useAuthStore } from '../../stores/authStore';
import { notify } from '../../utils/notify';
import { Price } from '../Price';
import { fixImageUrl } from '../../utils/images';

interface ProductCardProps {
  producto: Producto;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (producto: Producto) => Promise<void>;
}

export function ProductCard({ producto, viewMode = 'grid', onAddToCart }: ProductCardProps) {
  const getPrecio = useProductoStore((state) => state.getPrecio);

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
      <div className="flex gap-4 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
        <div className="relative flex-shrink-0">
          <img src={imagenPrincipal} alt={producto.nombre} className="w-32 h-32 object-cover rounded" />
        </div>
        <div className="flex-1">
          <Link to={`/producto/${producto.id}`}>
            <h3 className="font-semibold text-lg hover:text-blue-600">{producto.nombre}</h3>
          </Link>
          <p className="text-gray-600 text-sm mt-1">{producto.descripcion_corta}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600"><Price value={precioActual} /></span>
            {tieneDescuento && (
              <>
                <span className="text-sm text-gray-400 line-through"><Price value={precioVenta} /></span>
                <span className="text-sm text-green-600">-{producto.descuento_porcentaje}%</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {sinStock ? (
              <span className="text-red-600">Agotado</span>
            ) : (
              <span className="text-green-600">Stock: {stockDisponible} unidades</span>
            )}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              disabled={sinStock}
              className={`flex items-center gap-2 px-4 py-1 rounded text-sm transition ${
                sinStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {sinStock ? 'Sin stock' : 'Agregar'}
            </button>
            <button
              onClick={handleToggleWishlist}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 transition"
              title={enWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  enWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition relative">
      {/* Botón corazón */}
      <button
        onClick={handleToggleWishlist}
        className="absolute top-6 right-6 z-10 p-1.5 bg-white rounded-full shadow hover:scale-110 transition-transform"
        title={enWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        <Heart
          className={`w-5 h-5 transition-colors duration-200 ${
            enWishlist ? 'text-red-500 fill-red-500' : 'text-gray-300'
          }`}
        />
      </button>

      <Link to={`/producto/${producto.id}`}>
        <img src={imagenPrincipal} alt={producto.nombre} className="w-full h-48 object-cover rounded" />
      </Link>
      <Link to={`/producto/${producto.id}`}>
        <h3 className="font-semibold text-lg mt-2 hover:text-blue-600">{producto.nombre}</h3>
      </Link>
      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{producto.descripcion_corta}</p>
      <div className="mt-2">
        <span className="text-2xl font-bold text-blue-600"><Price value={precioActual} /></span>
        {tieneDescuento && (
          <>
            <span className="text-sm text-gray-400 line-through ml-2"><Price value={precioVenta} /></span>
            <span className="text-sm text-green-600 ml-1">-{producto.descuento_porcentaje}%</span>
          </>
        )}
      </div>
      <p className="text-xs mt-1">
        {sinStock ? (
          <span className="text-red-600">Agotado</span>
        ) : (
          <span className="text-green-600">Stock: {stockDisponible} unidades</span>
        )}
      </p>
      <button
        onClick={handleAddToCart}
        disabled={sinStock}
        className={`mt-3 w-full py-2 rounded transition ${
          sinStock
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {sinStock ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </div>
  );
}