import { useState, useEffect } from 'react';
import { catalogoApi } from '../../api/catalogo.api';
import type { Categoria, Marca, Subcategoria } from '../../api/catalogo.api';

interface ProductFiltersProps {
  onFilterChange: (filters: any) => void;
  initialFilters?: any;
}

export function ProductFilters({ onFilterChange, initialFilters = {} }: ProductFiltersProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [categoriaId, setCategoriaId] = useState(initialFilters.categoria_id || '');
  const [subcategoriaId, setSubcategoriaId] = useState(initialFilters.subcategoria_id || '');
  const [marcaId, setMarcaId] = useState(initialFilters.marca_id || '');
  const [precioMin, setPrecioMin] = useState(initialFilters.min_precio || '');
  const [precioMax, setPrecioMax] = useState(initialFilters.max_precio || '');
  const [search, setSearch] = useState(initialFilters.search || '');

  // Función para aplicar filtros manualmente
  const applyFilters = () => {
    const filters: any = {};
    if (search) filters.search = search;
    if (categoriaId) filters.categoria_id = Number(categoriaId);
    if (subcategoriaId) filters.subcategoria_id = Number(subcategoriaId);
    if (marcaId) filters.marca_id = Number(marcaId);
    if (precioMin !== '') filters.min_precio = Number(precioMin);
    if (precioMax !== '') filters.max_precio = Number(precioMax);
    console.log("🟡 ProductFilters.tsx applyFilters - Enviando filtros:", {
      precioMin,
      precioMax,
      filters
    });
    onFilterChange(filters);
  };

  useEffect(() => {
    catalogoApi.getCategorias().then(setCategorias);
    catalogoApi.getMarcas().then(setMarcas);
  }, []);

  useEffect(() => {
    if (categoriaId) {
      catalogoApi.getSubcategorias(Number(categoriaId)).then(setSubcategorias);
    } else {
      setSubcategorias([]);
      setSubcategoriaId('');
    }
  }, [categoriaId]);

  const limpiarFiltros = () => {
    setSearch('');
    setCategoriaId('');
    setSubcategoriaId('');
    setMarcaId('');
    setPrecioMin('');
    setPrecioMax('');
    onFilterChange({});
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-800">Filtros</h3>
        <button
          onClick={limpiarFiltros}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors font-medium"
        >
          Limpiar todo
        </button>
      </div>
      
      <div className="space-y-5">
        {/* Búsqueda por texto */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🔍 Buscar producto
          </label>
          <input
            type="text"
            placeholder="Ej: Samsung, iPhone..."
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📂 Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none bg-white"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        {/* Subcategoría */}
        {subcategorias.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📁 Subcategoría</label>
            <select
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none bg-white"
            >
              <option value="">Todas las subcategorías</option>
              {subcategorias.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Marca */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ Marca</label>
          <select
            value={marcaId}
            onChange={(e) => setMarcaId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none bg-white"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>{marca.nombre}</option>
            ))}
          </select>
        </div>

        {/* Rango de precio */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Rango de precio (S/)</label>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Mín"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              className="w-1/2 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
            />
            <input
              type="number"
              placeholder="Máx"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              className="w-1/2 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Incluye descuentos automáticamente
          </p>
        </div>
      </div>

      {/* Botón de aplicar filtros */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={applyFilters}
          className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 shadow-md"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}