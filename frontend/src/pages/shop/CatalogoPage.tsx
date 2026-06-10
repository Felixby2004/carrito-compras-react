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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Título principal */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Nuestro Catálogo
          </h1>
          <p className="text-gray-500">
            Encuentra los mejores productos a precios increíbles
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Botón de filtros para móvil */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          </div>

          {/* Sidebar de filtros */}
          <aside className={`lg:w-72 flex-shrink-0 ${
            showMobileFilters ? 'fixed inset-0 z-50 bg-white p-4 lg:relative lg:p-0 lg:bg-transparent' : 'hidden lg:block'
          }`}>
            {showMobileFilters && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Filtros</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            )}
            <ProductFilters onFilterChange={handleFilterChange} initialFilters={filters} />
          </aside>

          {/* Overlay para móvil cuando filtros están abiertos */}
          {showMobileFilters && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
          )}

          {/* Contenido principal */}
          <div className="flex-1">
            {/* Barra de herramientas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Contador de resultados */}
                <div className="flex items-center gap-2 text-gray-600">
                  <Search className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {loading ? 'Cargando...' : `${productos.length} productos encontrados`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Vista */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'grid'
                          ? 'bg-white shadow text-[var(--color-primary)]'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Vista cuadrícula"
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'list'
                          ? 'bg-white shadow text-[var(--color-primary)]'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Vista lista"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Items por página */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Mostrar:</span>
                    <select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      className="border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>

                  {/* Ordenar */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Ordenar:</span>
                    <select
                      value={sortBy}
                      onChange={handleSortChange}
                      className="border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
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
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
                <p className="mt-4 text-gray-500 text-lg">Cargando productos...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron productos</h3>
                <p className="text-gray-500 mb-4">Intenta ajustar tus filtros de búsqueda</p>
                <button
                  onClick={() => handleFilterChange({})}
                  className="px-6 py-2 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
                }>
                  {productos.map((producto) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      viewMode={viewMode}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>

                <div className="mt-8">
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