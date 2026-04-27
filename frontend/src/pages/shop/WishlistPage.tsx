import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { notify } from '../../utils/notify';
import apiClient from '../../api/client';
import type { Producto } from '../../types';

export function WishlistPage() {
  const { items, loadWishlist, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadWishlist();
  }, [isAuthenticated, loadWishlist]);

  useEffect(() => {
    const fetchProductos = async () => {
      if (items.length === 0) {
        setProductos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Cargar cada producto de la wishlist
        const responses = await Promise.allSettled(
          items.map((id) => apiClient.get(`/productos/${id}`))
        );
        const prods = responses
          .filter((r) => r.status === 'fulfilled')
          .map((r) => (r as PromiseFulfilledResult<any>).value.data.data);
        setProductos(prods);
      } catch (error) {
        console.error('Error cargando productos de wishlist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, [items]);

  const handleAddToCart = async (producto: Producto) => {
    try {
      await addItem(producto.id, 1);
      notify(`"${producto.nombre}" añadido al carrito`, 'success');
    } catch (error: any) {
      notify(error.response?.data?.message || 'Error al agregar al carrito', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Lista de Deseados</h1>
        <p className="text-gray-500 mb-6">Inicia sesión para ver tus productos favoritos.</p>
        <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Ir al inicio
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-500">Cargando tu lista de deseados...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-7 h-7 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold text-gray-800">Mi Lista de Deseados</h1>
        {productos.length > 0 && (
          <span className="ml-2 bg-red-100 text-red-600 text-sm font-medium px-3 py-1 rounded-full">
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>

      {productos.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Tu lista de deseados está vacía</h2>
          <p className="text-gray-400 mb-8">Agrega productos que te gusten dando clic en el corazón ❤️</p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <ShoppingCart className="w-5 h-5" />
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto) => {
            const imagen = producto.imagenes?.[0]?.url || 'https://placehold.co/300x300?text=Sin+imagen';
            const stockDisponible = Number(producto.stock_disponible) || 0;
            const sinStock = stockDisponible <= 0;

            return (
              <div
                key={producto.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
              >
                {/* Imagen */}
                <div className="relative">
                  <Link to={`/producto/${producto.id}`}>
                    <img
                      src={imagen}
                      alt={producto.nombre}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  {/* Botón quitar de wishlist */}
                  <button
                    onClick={() => toggleWishlist(producto.id, producto.nombre)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
                    title="Quitar de favoritos"
                  >
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  </button>
                  {sinStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-red-600 font-semibold text-sm px-3 py-1 rounded-full">Agotado</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <Link to={`/producto/${producto.id}`}>
                    <h3 className="font-semibold text-gray-800 hover:text-blue-600 transition line-clamp-2 mb-1">
                      {producto.nombre}
                    </h3>
                  </Link>
                  <p className="text-blue-600 font-bold text-lg mb-3">
                    S/ {Number(producto.precio_actual || producto.precio_venta || 0).toFixed(2)}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(producto)}
                      disabled={sinStock}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                        sinStock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {sinStock ? 'Sin stock' : 'Agregar'}
                    </button>
                    <button
                      onClick={() => toggleWishlist(producto.id, producto.nombre)}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 text-red-500 transition"
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
