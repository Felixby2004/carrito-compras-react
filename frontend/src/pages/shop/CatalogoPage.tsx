import { useState, useEffect } from 'react';
import { productosApi } from '../../api/productos.api';
import { ProductCard } from '../../components/productos/ProductCard';
import { ProductFilters } from '../../components/productos/ProductFilters';
import { Pagination } from '../../components/ui/Pagination';
import type { Producto } from '../../types';

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
  const [searchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Incluir search en los filtros
  useEffect(() => {
    setFilters((prev: any) => ({ ...prev, search: debouncedSearch || undefined }));
    setCurrentPage(1);
  }, [debouncedSearch]);

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de filtros */}
        <aside className="lg:w-64 flex-shrink-0">
          <ProductFilters onFilterChange={handleFilterChange} initialFilters={filters} />
        </aside>

        {/* Contenido principal */}
        <div className="flex-1">
          {/* Barra de herramientas */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                title="Vista cuadrícula"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                title="Vista lista"
              >
                ☰
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Mostrar:</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border rounded p-1 text-sm"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="border rounded p-1 text-sm"
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

          {/* Resultados */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No se encontraron productos</p>
              <button
                onClick={() => handleFilterChange({})}
                className="mt-2 text-blue-500 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
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

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}