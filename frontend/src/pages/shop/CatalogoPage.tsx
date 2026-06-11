import { useState, useEffect } from 'react';
import { productosApi } from '../../api/productos.api';
import { ProductCard } from '../../components/productos/ProductCard';
import { ProductFilters } from '../../components/productos/ProductFilters';
import { Pagination } from '../../components/ui/Pagination';
import type { Producto } from '../../types';
import { Grid, List, Filter, Search } from 'lucide-react';

interface CatalogoPageProps {
  onAddToCart: (producto: Producto) => Promise<void>;
}

export function CatalogoPage({ onAddToCart }: CatalogoPageProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [filters, setFilters] = useState<any>({});
  const [sortBy, setSortBy] = useState('fecha_desc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, [currentPage, itemsPerPage, filters, sortBy]);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const res = await productosApi.getProductos({
        page: currentPage,
        limit: itemsPerPage,
        ordenar: sortBy,
        ...filters,
      });
      setProductos(res.data);
      setTotalPages(res.totalPages);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="pb-20">
      <div className="container mx-auto px-4 py-12">
        {/* Título principal */}
        <div className="mb-10 text-center lg:text-left animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-black text-slate-800 mb-4">
            Nuestro Catálogo
          </h1>
          <p className="text-slate-500 text-xl">
            Encuentra los mejores productos a precios increíbles
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Botón de filtros para móvil */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/80 backdrop-blur-soft border border-white/60 rounded-2xl shadow-soft text-slate-700 font-bold hover:shadow-glow transition-all"
            >
              <Filter className="w-6 h-6" />
              Filtros
            </button>
          </div>

          {/* Sidebar de filtros */}
          <aside className={`lg:w-80 flex-shrink-0 ${
            showMobileFilters ? 'fixed inset-y-0 left-0 z-50 bg-white p-6 lg:relative lg:p-0 lg:bg-transparent overflow-y-auto' : 'hidden lg:block'
          }`}>
            {showMobileFilters && (
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-800">Filtros</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="bg-white/80 backdrop-blur-soft rounded-3xl shadow-soft border border-white/60 p-6">
              <ProductFilters onFilterChange={handleFilterChange} initialFilters={filters} />
            </div>
          </aside>

          {/* Overlay para móvil cuando filtros están abiertos */}
          {showMobileFilters && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setShowMobileFilters(false)}
            />
          )}

          {/* Contenido principal */}
          <div className="flex-1">
            {/* Barra de herramientas */}
            <div className="bg-white/80 backdrop-blur-soft rounded-3xl shadow-soft border border-white/60 p-6 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-6">
                {/* Contador de resultados */}
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Search className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-base font-semibold">
                    {loading ? 'Cargando...' : `${productos.length} productos encontrados`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {/* Vista */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-xl transition-all ${
                        viewMode === 'grid'
                          ? 'bg-gradient-primary text-white shadow-glow'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                      }`}
                      title="Vista cuadrícula"
                    >
                      <Grid className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-xl transition-all ${
                        viewMode === 'list'
                          ? 'bg-gradient-primary text-white shadow-glow'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                      }`}
                      title="Vista lista"
                    >
                      <List className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Items por página */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 font-semibold">Mostrar:</span>
                    <select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      className="border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>

                  {/* Ordenar */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 font-semibold">Ordenar:</span>
                    <select
                      value={sortBy}
                      onChange={handleSortChange}
                      className="border border-slate-200 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium"
                    >
                      <option value="fecha_desc">Más recientes</option>
                      <option value="fecha_asc">Más antiguos</option>
                      <option value="precio_asc">Precio: menor a mayor</option>
                      <option value="precio_desc">Precio: mayor a menor</option>
                      <option value="nombre_asc">Nombre: A-Z</option>
                      <option value="nombre_desc">Nombre: Z-A</option>
                      <option value="popularidad">⭐ Más vendidos</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Resultados */}
            {loading ? (
              <div className="text-center py-24 bg-white/80 backdrop-blur-soft rounded-3xl shadow-soft border border-white/60">
                <div className="inline-block animate-spin-slow rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent shadow-glow"></div>
                <p className="mt-6 text-slate-500 text-xl font-semibold">Cargando productos...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-24 bg-white/80 backdrop-blur-soft rounded-3xl shadow-soft border border-white/60">
                <div className="text-7xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-slate-700 mb-3">No se encontraron productos</h3>
                <p className="text-slate-500 text-lg mb-8">Intenta ajustar tus filtros de búsqueda</p>
                <button
                  onClick={() => handleFilterChange({})}
                  className="px-8 py-4 rounded-2xl text-white font-bold bg-gradient-primary shadow-glow hover:scale-105 transition-all"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8'
                  : 'flex flex-col gap-6'
                }>
                  {productos.map((producto, index) => (
                    <div key={producto.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <ProductCard
                        producto={producto}
                        viewMode={viewMode}
                        onAddToCart={onAddToCart}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
