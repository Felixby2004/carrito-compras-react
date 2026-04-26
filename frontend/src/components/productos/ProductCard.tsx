import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Producto } from '../../types';

interface ProductCardProps {
  producto: Producto;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (producto: Producto) => Promise<void>;
}

export function ProductCard({ producto, viewMode = 'grid', onAddToCart }: ProductCardProps) {
  // Asegurar que los valores son números
  const precioActual = typeof producto.precio_actual === 'number' 
    ? producto.precio_actual 
    : Number(producto.precio_actual) || Number(producto.precio_venta) || 0;
    
  const precioVenta = typeof producto.precio_venta === 'number' 
    ? producto.precio_venta 
    : Number(producto.precio_venta) || 0;
    
  const tieneDescuento = (producto.descuento_porcentaje || 0) > 0;
  const imagenPrincipal = producto.imagenes?.[0]?.url || 'https://placehold.co/300x300?text=Sin+imagen';
  const stockDisponible = typeof producto.stock_disponible === 'number' 
    ? producto.stock_disponible 
    : Number(producto.stock_disponible) || 0;
  const sinStock = stockDisponible <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sinStock) {
      alert('Producto agotado');
      return;
    }
    if (onAddToCart) {
      await onAddToCart(producto);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
        <img src={imagenPrincipal} alt={producto.nombre} className="w-32 h-32 object-cover rounded" />
        <div className="flex-1">
          <Link to={`/producto/${producto.id}`}>
            <h3 className="font-semibold text-lg hover:text-blue-600">{producto.nombre}</h3>
          </Link>
          <p className="text-gray-600 text-sm mt-1">{producto.descripcion_corta}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">S/ {precioActual.toFixed(2)}</span>
            {tieneDescuento && (
              <>
                <span className="text-sm text-gray-400 line-through">S/ {precioVenta.toFixed(2)}</span>
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
          <button
            onClick={handleAddToCart}
            disabled={sinStock}
            className={`mt-2 flex items-center gap-2 px-4 py-1 rounded text-sm transition ${
              sinStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {sinStock ? 'Sin stock' : 'Agregar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      <Link to={`/producto/${producto.id}`}>
        <img src={imagenPrincipal} alt={producto.nombre} className="w-full h-48 object-cover rounded" />
      </Link>
      <Link to={`/producto/${producto.id}`}>
        <h3 className="font-semibold text-lg mt-2 hover:text-blue-600">{producto.nombre}</h3>
      </Link>
      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{producto.descripcion_corta}</p>
      <div className="mt-2">
        <span className="text-2xl font-bold text-blue-600">S/ {precioActual.toFixed(2)}</span>
        {tieneDescuento && (
          <>
            <span className="text-sm text-gray-400 line-through ml-2">S/ {precioVenta.toFixed(2)}</span>
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