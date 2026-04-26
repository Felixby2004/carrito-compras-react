import { useEffect, useState } from 'react';
import { productosApi } from '../../api/productos.api';
import { ProductCard } from '../../components/productos/ProductCard';
import type { Producto } from '../../types';

interface HomePageProps {
  onAddToCart: (producto: Producto) => Promise<void>;
}

export function HomePage({ onAddToCart }: HomePageProps) {
  const [destacados, setDestacados] = useState<Producto[]>([]);
  const [ofertas, setOfertas] = useState<Producto[]>([]);
  const [nuevos, setNuevos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarProductos = async () => {
      setLoading(true);
      try {
        const [dest, ofe, nue] = await Promise.all([
          productosApi.getDestacados(8),
          productosApi.getOfertas(8),
          productosApi.getNuevos(8),
        ]);
        setDestacados(dest);
        setOfertas(ofe);
        setNuevos(nue);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarProductos();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          ¡Bienvenido a E-Commerce!
        </h1>
        <p className="text-lg md:text-xl mb-6">
          Los mejores productos al mejor precio
        </p>
        <a
          href="/catalogo"
          className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Ver catálogo completo →
        </a>
      </div>

      {/* Productos Destacados */}
      {destacados.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>⭐</span> Productos Destacados
            </h2>
            <a href="/catalogo" className="text-blue-500 hover:underline text-sm">
              Ver todos →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destacados.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Productos en Oferta */}
      {ofertas.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🔥</span> Ofertas Especiales
            </h2>
            <a href="/catalogo" className="text-blue-500 hover:underline text-sm">
              Ver todos →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ofertas.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Nuevos Ingresos */}
      {nuevos.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🆕</span> Nuevos Ingresos
            </h2>
            <a href="/catalogo" className="text-blue-500 hover:underline text-sm">
              Ver todos →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nuevos.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mensaje si no hay productos */}
      {destacados.length === 0 && ofertas.length === 0 && nuevos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay productos disponibles</p>
        </div>
      )}
    </div>
  );
}