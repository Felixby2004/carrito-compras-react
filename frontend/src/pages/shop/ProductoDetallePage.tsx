import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, ZoomIn, Star } from 'lucide-react';
import { productosApi } from '../../api/productos.api';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import type { Producto } from '../../types';
import { useProductoStore } from '../../stores/productoStore';
import { getSocket } from '../../socket';
import { notify } from '../../utils/notify';

export function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);
  const getPrecio = useProductoStore((state) => state.getPrecio);
  
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [productosRelacionados, setProductosRelacionados] = useState<Producto[]>([]);
  const [reseñas, setReseñas] = useState<any[]>([]);
  const [promedioReseñas, setPromedioReseñas] = useState(0);
  const [totalReseñas, setTotalReseñas] = useState(0);
  const [miCalificacion, setMiCalificacion] = useState<number>(5);
  const [miComentario, setMiComentario] = useState<string>('');
  const [enviandoResena, setEnviandoResena] = useState(false);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  // ========== FUNCIONES ==========
  
  const cargarResenas = async (productoId: number) => {
    try {
      const response = await fetch(`/api/v1/resenas/producto/${productoId}`);
      const data = await response.json();
      setReseñas(data.data || []);
      setPromedioReseñas(data.promedio || 0);
      setTotalReseñas(data.total || 0);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    }
  };

  const cargarProducto = async (productoId: number) => {
    setLoading(true);
    try {
      const [prod, relacionados] = await Promise.all([
        productosApi.getProductoById(productoId),
        productosApi.getRelacionados(productoId, 4),
      ]);
      setProducto(prod);
      setProductosRelacionados(relacionados);
      
      await cargarResenas(productoId);
    } catch (error) {
      console.error('Error cargando producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      notify('Inicia sesión para agregar a tu lista de deseos', 'info');
      return;
    }
    if (!producto) return;
    try {
      await toggleWishlist(producto.id, producto.nombre);
    } catch {}
  };

  const enviarResena = async () => {
    if (!isAuthenticated) {
      notify('Inicia sesión para dejar una reseña', 'info');
      return;
    }
    if (!producto) return;
    setEnviandoResena(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        notify('Tu sesión expiró. Inicia sesión nuevamente.', 'info');
        return;
      }
      const response = await fetch('/api/v1/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productoId: producto.id,
          calificacion: miCalificacion,
          comentario: miComentario,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        notify(data.message || 'No se pudo enviar la reseña', 'error');
        return;
      }
      notify('Reseña enviada', 'success');
      setMiComentario('');
      await cargarResenas(producto.id);
    } catch {
      notify('No se pudo enviar la reseña', 'error');
    } finally {
      setEnviandoResena(false);
    }
  };

  const handleAddToCart = async () => {
    if (!producto) return;
    
    const stockDisponible = producto.stock_disponible || 0;
    
    if (stockDisponible <= 0) {
      notify('Producto agotado', 'error');
      return;
    }
    
    if (cantidad > stockDisponible) {
      notify(`Solo hay ${stockDisponible} unidades disponibles`, 'info');
      return;
    }
    
    try {
      await addItem(producto.id, cantidad);
      notify(`Agregado: ${cantidad}x ${producto.nombre}`, 'success');
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 'Error al agregar al carrito';
      notify(mensaje, 'error');
    }
  };

  const handleImageZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  // ========== EFFECTS ==========
  
  useEffect(() => {
    if (id) {
      cargarProducto(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !producto) return;
    
    const handlePrecioActualizado = (data: any) => {
      if (data.productoId === producto.id) {
        setProducto(prev => prev ? {
          ...prev,
          precio_venta: data.precioNuevo,
          precio_actual: data.precioNuevo,
        } : null);
      }
    };
    
    socket.on('precio-actualizado', handlePrecioActualizado);
    return () => {
      socket.off('precio-actualizado', handlePrecioActualizado);
    };
  }, [producto?.id]);

  // ========== RENDER ==========
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2">Cargando producto...</p>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-500">Producto no encontrado</p>
        <Link to="/catalogo" className="text-blue-500 hover:underline mt-2 inline-block">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const precioActualCalculado = getPrecio(producto.id, producto.precio_actual || producto.precio_venta);
  const tieneDescuento = producto.descuento_porcentaje > 0;
  const stockDisponible = producto.stock_disponible || 0;
  const imagenes = producto.imagenes?.length > 0 ? producto.imagenes : [{ url: 'https://placehold.co/600x600?text=Sin+imagen', es_principal: true }];
  const imagenPrincipal = imagenes[selectedImage]?.url;
  const enWishlist = producto ? isInWishlist(producto.id) : false;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link to="/catalogo" className="hover:text-blue-600">Catálogo</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{producto.nombre}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galería de imágenes */}
        <div>
          <div
            className="relative bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleImageZoom}
          >
            <img
              src={imagenPrincipal}
              alt={producto.nombre}
              className="w-full h-96 object-contain"
              style={{
                transform: zoom ? 'scale(2)' : 'scale(1)',
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                transition: 'transform 0.1s ease',
              }}
            />
            {zoom && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                <ZoomIn className="w-3 h-3 inline mr-1" />
                Zoom activado
              </div>
            )}
          </div>

          {imagenes.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {imagenes.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === idx ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img.url} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
          
          <div className="text-sm text-gray-500 mb-4">
            {producto.marca && <span>Marca: {producto.marca.nombre}</span>}
            <span className="mx-2">|</span>
            <span>SKU: {producto.sku}</span>
          </div>

          <div className="mb-4">
            {tieneDescuento ? (
              <div>
                <span className="text-3xl font-bold text-blue-600">S/ {precioActualCalculado.toFixed(2)}</span>
                <span className="text-lg text-gray-400 line-through ml-2">S/ {producto.precio_venta.toFixed(2)}</span>
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  -{producto.descuento_porcentaje}%
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-blue-600">S/ {precioActualCalculado.toFixed(2)}</span>
            )}
          </div>

          <div className="mb-4">
            {stockDisponible > 0 ? (
              <p className="text-green-600 text-sm">
                ✓ Stock disponible: {stockDisponible} unidades
              </p>
            ) : (
              <p className="text-red-600 text-sm">✗ Producto agotado</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad:</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                disabled={cantidad <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold">{cantidad}</span>
              <button
                onClick={() => setCantidad(Math.min(stockDisponible, cantidad + 1))}
                disabled={cantidad >= stockDisponible}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500 ml-2">
                {stockDisponible > 0 ? `Máx. ${stockDisponible}` : 'Sin stock'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={stockDisponible <= 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition ${
                stockDisponible > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              Agregar al carrito
            </button>
            <button
              onClick={handleAddToWishlist}
              className={`p-3 border rounded-lg transition ${
                enWishlist
                  ? 'bg-red-50 border-red-500 text-red-500'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${enWishlist ? 'fill-red-500' : ''}`} />
            </button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">Descripción del producto</h3>
            <p className="text-gray-700 leading-relaxed">
              {producto.descripcion_larga || producto.descripcion_corta || 'Sin descripción disponible.'}
            </p>
          </div>
        </div>
      </div>

      {/* Reseñas */}
      <div className="mt-12">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold">Reseñas de clientes</h2>
          {totalReseñas > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(promedioReseñas)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                ({promedioReseñas.toFixed(1)} - {totalReseñas} reseñas)
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2" />
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">Deja tu reseña</h3>
            <p className="text-xs text-gray-500 mb-3">Solo podrás reseñar productos que hayas comprado.</p>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMiCalificacion(v)}
                  className="p-1"
                  title={`${v} estrella${v === 1 ? '' : 's'}`}
                >
                  <Star className={`w-6 h-6 ${v <= miCalificacion ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={miComentario}
              onChange={(e) => setMiComentario(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              rows={4}
              placeholder="Escribe un comentario (opcional)"
            />
            <button
              onClick={enviarResena}
              disabled={enviandoResena}
              className="w-full mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {enviandoResena ? 'Enviando…' : 'Enviar reseña'}
            </button>
          </div>
        </div>
        
        {reseñas.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No hay reseñas aún. ¡Sé el primero en opinar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reseñas.map((reseña) => (
              <div key={reseña.id} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= reseña.calificacion
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(reseña.fecha_resena).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{reseña.comentario}</p>
                <p className="text-sm text-gray-500 mt-1">
                  - {reseña.cliente?.usuario?.email?.split('@')[0] || 'Cliente'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Productos relacionados */}
      {productosRelacionados.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productosRelacionados.map((rel) => (
              <Link key={rel.id} to={`/producto/${rel.id}`} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                <img
                  src={rel.imagenes?.[0]?.url || 'https://placehold.co/200x200?text=Producto'}
                  alt={rel.nombre}
                  className="w-full h-40 object-cover rounded mb-3"
                />
                <h3 className="font-semibold text-center hover:text-blue-600">{rel.nombre}</h3>
                <p className="text-center text-blue-600 font-bold mt-1">
                  S/ {(rel.precio_actual || rel.precio_venta).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}