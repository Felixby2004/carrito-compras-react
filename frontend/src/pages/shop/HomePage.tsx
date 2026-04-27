import { useEffect, useState } from 'react';
import { productosApi } from '../../api/productos.api';
import { ProductCard } from '../../components/productos/ProductCard';
import type { Producto } from '../../types';

interface HomePageProps {
  onAddToCart: (producto: Producto) => Promise<void>;
  isAuthenticated?: boolean;
}

export function HomePage({ onAddToCart, isAuthenticated }: HomePageProps) {
  const [destacados, setDestacados] = useState<Producto[]>([]);
  const [ofertas, setOfertas] = useState<Producto[]>([]);
  const [nuevos, setNuevos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const heroSlides = [
    {
      title: 'Tecnologia para tu dia a dia',
      text: 'Descubre productos destacados, ofertas y novedades cada semana.',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=60',
    },
    {
      title: 'Ofertas especiales por tiempo limitado',
      text: 'Aprovecha descuentos exclusivos en categorias seleccionadas.',
      image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&auto=format&fit=crop&q=60',
    },
    {
      title: 'Compra rapido y seguro',
      text: 'Carrito inteligente, cupones y seguimiento de pedidos en un solo lugar.',
      image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&auto=format&fit=crop&q=60',
    },
  ];

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

  useEffect(() => {
    const timer = setInterval(() => setSlide((prev) => (prev + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
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
      <div className="relative overflow-hidden rounded-2xl mb-12 h-[280px] md:h-[340px]">
        <img src={heroSlides[slide].image} alt={heroSlides[slide].title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-blue-900/55 to-transparent" />
        <div className="relative text-white p-8 md:p-12 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">{heroSlides[slide].title}</h1>
          <p className="text-base md:text-lg mb-6">{heroSlides[slide].text}</p>
        <a
          href="/catalogo"
          className="inline-block bg-white px-6 py-3 rounded-lg font-semibold transition"
          style={{ color: 'var(--color-primary, #2563eb)' }}
        >
          Ver catálogo completo →
        </a>
        <div className="mt-6 flex gap-2">
          {heroSlides.map((_, idx) => (
            <button key={idx} onClick={() => setSlide(idx)} className={`w-3 h-3 rounded-full ${slide === idx ? 'bg-white' : 'bg-white/45'}`} />
          ))}
        </div>
        </div>
      </div>

      {/* Sección de Pedidos si está autenticado */}
      {isAuthenticated && (
        <div className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-2">📦 Revisa tus pedidos</h2>
          <p className="text-blue-100 mb-6">Mantente al tanto del estado de tus compras y realiza un seguimiento de tus entregas.</p>
          <a
            href="/mis-ordenes"
            className="inline-block bg-white px-6 py-3 rounded-lg font-semibold text-blue-600 hover:bg-blue-50 transition"
          >
            Ver mis pedidos →
          </a>
        </div>
      )}

      {/* Productos Destacados */}
      {destacados.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>⭐</span> Productos Destacados
            </h2>
            <a href="/catalogo" className="hover:underline text-sm" style={{ color: 'var(--color-primary, #2563eb)' }}>
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
            <a href="/catalogo" className="hover:underline text-sm" style={{ color: 'var(--color-primary, #2563eb)' }}>
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
            <a href="/catalogo" className="hover:underline text-sm" style={{ color: 'var(--color-primary, #2563eb)' }}>
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