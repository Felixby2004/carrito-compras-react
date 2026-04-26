import { useState, useEffect } from 'react';
import { catalogoApi } from '../../api/catalogo.api';
import type { Categoria, Marca, Subcategoria, Atributo } from '../../api/catalogo.api';

interface ProductFiltersProps {
  onFilterChange: (filters: any) => void;
  initialFilters?: any;
}

export function ProductFilters({ onFilterChange, initialFilters = {} }: ProductFiltersProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [categoriaId, setCategoriaId] = useState(initialFilters.categoria_id || '');
  const [subcategoriaId, setSubcategoriaId] = useState(initialFilters.subcategoria_id || '');
  const [marcaId, setMarcaId] = useState(initialFilters.marca_id || '');
  const [precioMin, setPrecioMin] = useState(initialFilters.min_precio || '');
  const [precioMax, setPrecioMax] = useState(initialFilters.max_precio || '');
  const [atributosSeleccionados, setAtributosSeleccionados] = useState<Record<string, string>>({});

  useEffect(() => {
    catalogoApi.getCategorias().then(setCategorias);
    catalogoApi.getMarcas().then(setMarcas);
    catalogoApi.getAtributos().then(setAtributos);
  }, []);

  useEffect(() => {
    if (categoriaId) {
      catalogoApi.getSubcategorias(Number(categoriaId)).then(setSubcategorias);
    } else {
      setSubcategorias([]);
      setSubcategoriaId('');
    }
  }, [categoriaId]);

  const aplicarFiltros = () => {
    const filters: any = {};
    if (categoriaId) filters.categoria_id = Number(categoriaId);
    if (subcategoriaId) filters.subcategoria_id = Number(subcategoriaId);
    if (marcaId) filters.marca_id = Number(marcaId);
    if (precioMin) filters.min_precio = Number(precioMin);
    if (precioMax) filters.max_precio = Number(precioMax);
    if (Object.keys(atributosSeleccionados).length > 0) {
      filters.atributos = atributosSeleccionados;
    }
    onFilterChange(filters);
  };

  const limpiarFiltros = () => {
    setCategoriaId('');
    setSubcategoriaId('');
    setMarcaId('');
    setPrecioMin('');
    setPrecioMax('');
    setAtributosSeleccionados({});
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4 border-b pb-2">Filtros</h3>
      
      <div className="space-y-4">
        {/* Búsqueda por texto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar producto
          </label>
          <input
            type="text"
            placeholder="Ej: Samsung, iPhone..."
            className="w-full border rounded-md p-2"
            value={initialFilters.search || ''}
            onChange={(e) => onFilterChange({ ...initialFilters, search: e.target.value })}
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="">Todas</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        {/* Subcategoría */}
        {subcategorias.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
            <select
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="">Todas</option>
              {subcategorias.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Marca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
          <select
            value={marcaId}
            onChange={(e) => setMarcaId(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="">Todas</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>{marca.nombre}</option>
            ))}
          </select>
        </div>

        {/* Rango de precio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rango de precio (S/)</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              className="w-1/2 border rounded-md p-2"
            />
            <input
              type="number"
              placeholder="Máx"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              className="w-1/2 border rounded-md p-2"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Considera precios con descuento automáticamente
          </p>
        </div>

        {/* Atributos (talla, color, etc.) */}
        {atributos.map((atributo) => (
          <div key={atributo.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {atributo.nombre}
            </label>
            <select
              value={atributosSeleccionados[atributo.id] || ''}
              onChange={(e) => {
                const nuevos = { ...atributosSeleccionados };
                if (e.target.value) {
                  nuevos[atributo.id] = e.target.value;
                } else {
                  delete nuevos[atributo.id];
                }
                setAtributosSeleccionados(nuevos);
              }}
              className="w-full border rounded-md p-2"
            >
              <option value="">Todos</option>
              {atributo.valores.map((valor) => (
                <option key={valor.id} value={valor.id}>{valor.valor}</option>
              ))}
            </select>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <button
            onClick={aplicarFiltros}
            className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
          >
            Aplicar filtros
          </button>
          <button
            onClick={limpiarFiltros}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}