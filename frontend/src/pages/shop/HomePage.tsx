import { useEffect, useState } from 'react';
import { productosApi } from '../../api/productos.api';
import { ProductCard } from '../../components/productos/ProductCard';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Star, Sparkles, Zap } from 'lucide-react';
import type { Producto } from '../../types';

interface HomePageProps {
  onAddToCart: (producto: Producto) => Promise<void>;
  isAuthenticated?: boolean;
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
        setDestacados(dest || []);
        setOfertas(ofe || []);
        setNuevos(nue || []);
      } catch (error) {
        console.error('Error cargando productos:', error);
        setDestacados([]);
        setOfertas([]);
        setNuevos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarProductos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary animate-spin-slow"></div>
          <p className="text-2xl font-bold text-slate-700">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-24 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-soft px-6 py-3 rounded-full mb-8 border border-white/30">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold">¡Nuevos productos cada semana!</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
              Encuentra lo que <br />
              <span className="text-yellow-300">amas</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto">
              Descubre productos increíbles con los mejores precios. Envío rápido y seguro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/catalogo" 
                className="group bg-white text-slate-800 px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-glow hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                <ShoppingBag className="w-6 h-6" />
                Ver Catálogo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a 
                href="#destacados" 
                className="bg-white/20 backdrop-blur-soft text-white px-10 py-5 rounded-2xl font-bold text-xl border border-white/30 hover:bg-white/30 hover:scale-105 transition-all duration-300"
              >
                Ver Ofertas
              </a>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-5xl font-black">+1000</div>
                <div className="text-white/80 text-lg">Productos</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black">24h</div>
                <div className="text-white/80 text-lg">Envío rápido</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black">100%</div>
                <div className="text-white/80 text-lg">Seguridad</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Productos Destacados */}
        {destacados.length > 0 && (
          <section id="destacados" className="mb-16 mt-16 animate-slide-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-primary rounded-2xl shadow-glow">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-800">Productos Destacados</h2>
                  <p className="text-slate-500 text-lg">Los más populares</p>
                </div>
              </div>
              <Link 
                to="/catalogo" 
                className="group flex items-center gap-2 text-indigo-600 font-bold text-lg hover:text-indigo-700 transition-colors"
              >
                Ver todos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {destacados.map((producto, index) => (
                <div key={producto.id} style={{ animationDelay: `${index * 0.1}s` }} className="animate-slide-up">
                  <ProductCard
                    producto={producto}
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Productos en Oferta */}
        {ofertas.length > 0 && (
          <section className="mb-16 py-12 bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="px-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-accent rounded-2xl shadow-glow">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-slate-800">Ofertas Especiales</h2>
                    <p className="text-slate-500 text-lg">¡No te las pierdas!</p>
                  </div>
                </div>
                <Link 
                  to="/catalogo" 
                  className="group flex items-center gap-2 text-indigo-600 font-bold text-lg hover:text-indigo-700 transition-colors"
                >
                  Ver todos
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {ofertas.map((producto, index) => (
                  <div key={producto.id} style={{ animationDelay: `${index * 0.1 + 0.3}s` }} className="animate-slide-up">
                    <ProductCard
                      producto={producto}
                      onAddToCart={onAddToCart}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Nuevos Ingresos */}
        {nuevos.length > 0 && (
          <section className="mb-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-glow">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-800">Nuevos Ingresos</h2>
                  <p className="text-slate-500 text-lg">Lo último en tendencia</p>
                </div>
              </div>
              <Link 
                to="/catalogo" 
                className="group flex items-center gap-2 text-indigo-600 font-bold text-lg hover:text-indigo-700 transition-colors"
              >
                Ver todos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {nuevos.map((producto, index) => (
                <div key={producto.id} style={{ animationDelay: `${index * 0.1 + 0.5}s` }} className="animate-slide-up">
                  <ProductCard
                    producto={producto}
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mensaje si no hay productos */}
        {destacados.length === 0 && ofertas.length === 0 && nuevos.length === 0 && (
          <div className="text-center py-24 bg-white/60 backdrop-blur-soft rounded-3xl border border-white/50 shadow-soft-lg">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">No hay productos disponibles</h3>
            <p className="text-slate-500 text-lg">Vuelve pronto para ver las nuevas novedades</p>
          </div>
        )}
      </div>
    </div>
  );
}
