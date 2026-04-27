import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, Search, X } from 'lucide-react';
import type { Producto } from '../../types';
import apiClient from '../../api/client';
import { notify } from '../../utils/notify';
import { Pagination } from '../../components/ui/Pagination';

interface Categoria {
  id: number;
  nombre: string;
}

interface Subcategoria {
  id: number;
  nombre: string;
  categoria_id: number;
}

interface Marca {
  id: number;
  nombre: string;
}

interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
}

export function ProductosAdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [imagenesProducto, setImagenesProducto] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    categoria_id: '',
    subcategoria_id: '',
    marca_id: '',
    unidad_medida_id: '',
    precio_costo: '',
    precio_venta: '',
    precio_oferta: '',
    fecha_inicio_oferta: '',
    fecha_fin_oferta: '',
    stock: '',
    stock_minimo: '0',
    peso: '',
    ancho: '',
    alto: '',
    profundidad: '',
    estado: 'activo',
    etiquetas: [] as string[],
  });

  useEffect(() => {
    cargarProductos();
    cargarCatalogos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      // Usar estado=todos para traer productos activos, inactivos y borradores
      const response = await apiClient.get('/productos/todos');
      const productosConStock = response.data.data.map((p: any) => ({
        ...p,
        stock: p.stock || { stock_minimo: 0 }
      }));
      setProductos(productosConStock);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [cats, subs, mar, um] = await Promise.all([
        apiClient.get('/productos/categorias').catch(err => {
          console.error('Error cargando categorías:', err);
          return { data: { data: [] } };
        }),
        apiClient.get('/productos/subcategorias').catch(err => {
          console.error('Error cargando subcategorías:', err);
          return { data: { data: [] } };
        }),
        apiClient.get('/productos/marcas').catch(err => {
          console.error('Error cargando marcas:', err);
          return { data: { data: [] } };
        }),
        apiClient.get('/productos/unidades-medida').catch(err => {
          console.error('Error cargando unidades de medida:', err);
          return { data: { data: [] } };
        }),
      ]);
      setCategorias(cats.data.data || []);
      setSubcategorias(subs.data.data || []);
      setMarcas(mar.data.data || []);
      setUnidadesMedida(um.data.data || []);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let fechaInicio = undefined;
      let fechaFin = undefined;
      
      if (formData.fecha_inicio_oferta) {
        fechaInicio = new Date(formData.fecha_inicio_oferta).toISOString();
      }
      if (formData.fecha_fin_oferta) {
        fechaFin = new Date(formData.fecha_fin_oferta).toISOString();
      }
      
      const data = {
        sku: formData.sku,
        nombre: formData.nombre,
        descripcion_corta: formData.descripcion_corta,
        descripcion_larga: formData.descripcion_larga,
        categoria_id: parseInt(formData.categoria_id),
        subcategoria_id: formData.subcategoria_id ? parseInt(formData.subcategoria_id) : undefined,
        marca_id: formData.marca_id ? parseInt(formData.marca_id) : undefined,
        unidad_medida_id: formData.unidad_medida_id ? parseInt(formData.unidad_medida_id) : undefined,
        precio_costo: formData.precio_costo ? parseFloat(formData.precio_costo) : 0,
        precio_venta: parseFloat(formData.precio_venta),
        precio_oferta: formData.precio_oferta ? parseFloat(formData.precio_oferta) : undefined,
        fecha_inicio_oferta: fechaInicio,
        fecha_fin_oferta: fechaFin,
        stock: parseInt(formData.stock),
        stock_minimo: parseInt(formData.stock_minimo),
        estado: formData.estado,
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        ancho: formData.ancho ? parseFloat(formData.ancho) : undefined,
        alto: formData.alto ? parseFloat(formData.alto) : undefined,
        profundidad: formData.profundidad ? parseFloat(formData.profundidad) : undefined,
      };

      if (editingProducto) {
        await apiClient.put(`/productos/${editingProducto.id}`, data);
        notify('Producto actualizado', 'success');
      } else {
        await apiClient.post('/productos', data);
        notify('Producto creado', 'success');
      }
      
      setShowModal(false);
      setEditingProducto(null);
      resetForm();
      cargarProductos();
    } catch (error: any) {
      console.error('Error guardando producto:', error);
      notify(error.response?.data?.message || 'Error al guardar producto', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este producto?')) {
      try {
        await apiClient.delete(`/productos/${id}`);
        notify('Producto eliminado', 'success');
        cargarProductos();
      } catch (error: any) {
        console.error('Error eliminando producto:', error);
        notify(error.response?.data?.message || 'Error al eliminar producto', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      nombre: '',
      descripcion_corta: '',
      descripcion_larga: '',
      categoria_id: '',
      subcategoria_id: '',
      marca_id: '',
      unidad_medida_id: '',
      precio_costo: '',
      precio_venta: '',
      precio_oferta: '',
      fecha_inicio_oferta: '',
      fecha_fin_oferta: '',
      stock: '',
      stock_minimo: '0',
      peso: '',
      ancho: '',
      alto: '',
      profundidad: '',
      estado: 'activo',
      etiquetas: [],
    });
  };

  // Función para cargar imágenes
  const cargarImagenesProducto = async (productoId: number) => {
    try {
      const response = await apiClient.get(`/productos/${productoId}/imagenes`);
      setImagenesProducto(response.data.data || []);
    } catch (error) {
      console.error('Error cargando imágenes:', error);
      setImagenesProducto([]);
    }
  };

  const openEditModal = async (producto: Producto) => {
  setEditingProducto(producto);
  
  let fechaInicio = '';
  let fechaFin = '';
  
  if (producto.fecha_inicio_oferta) {
    fechaInicio = producto.fecha_inicio_oferta.split('T')[0];
  }
  if (producto.fecha_fin_oferta) {
    fechaFin = producto.fecha_fin_oferta.split('T')[0];
  }
  
  // Obtener stock mínimo desde la relación stock
  const stockMinimo = producto.stock?.stock_minimo || 0;
  
  setFormData({
    sku: producto.sku,
    nombre: producto.nombre,
    descripcion_corta: producto.descripcion_corta || '',
    descripcion_larga: producto.descripcion_larga || '',
    categoria_id: producto.categoria_id?.toString() || '',
    subcategoria_id: producto.subcategoria_id?.toString() || '',
    marca_id: producto.marca_id?.toString() || '',
    unidad_medida_id: (producto as any).unidad_medida_id?.toString() || '',
    precio_costo: producto.precio_costo?.toString() || '',
    precio_venta: producto.precio_venta?.toString() || '',
    precio_oferta: producto.precio_oferta?.toString() || '',
    fecha_inicio_oferta: fechaInicio,
    fecha_fin_oferta: fechaFin,
    stock: (producto.stock_disponible || 0).toString(),
    stock_minimo: stockMinimo.toString(),
    peso: producto.peso?.toString() || '',
    ancho: producto.ancho?.toString() || '',
    alto: producto.alto?.toString() || '',
    profundidad: producto.profundidad?.toString() || '',
    estado: producto.estado || 'activo',
    etiquetas: [],
  });
  
  await cargarImagenesProducto(producto.id);
  setShowModal(true);
};

  const handleExportCSV = () => {
    const headers = ['SKU', 'Nombre', 'Precio Venta', 'Stock', 'Estado'];
    const rows = productos.map(p => [p.sku, p.nombre, p.precio_venta, p.stock_disponible, p.estado]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productos_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredProductos = productos.filter(p =>
    (p?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p?.sku?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (p?.activo === true || p?.activo !== false)
  );

  const totalPages = Math.ceil(filteredProductos.length / ITEMS_PER_PAGE);
  const paginatedProductos = filteredProductos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Resetear página al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const subcategoriasFiltradas = subcategorias.filter(
    sub => sub.categoria_id === parseInt(formData.categoria_id)
  );

  if (loading) return <div className="text-center py-12">Cargando productos...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => {
              setEditingProducto(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Producto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Categoría</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Precio</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Stock</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Estado</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProductos.map((producto) => (
              <tr key={producto.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{producto.sku}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">{producto.descripcion_corta?.slice(0, 50)}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{producto.categoria?.nombre || '-'}</td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  S/ {producto.precio_venta?.toFixed(2) || '0.00'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    (producto.stock_disponible || 0) > 10 ? 'bg-green-100 text-green-700' :
                    (producto.stock_disponible || 0) > 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {producto.stock_disponible || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    producto.estado === 'activo' ? 'bg-green-100 text-green-700' :
                    producto.estado === 'inactivo' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {producto.estado === 'activo' ? 'Activo' : 
                     producto.estado === 'inactivo' ? 'Inactivo' : 'Borrador'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(producto)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredProductos.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Modal de producto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* SKU y Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              {/* Descripciones */}
              <div>
                <label className="block text-sm font-medium mb-1">Descripción Corta</label>
                <textarea
                  value={formData.descripcion_corta}
                  onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value })}
                  rows={2}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción Larga</label>
                <textarea
                  value={formData.descripcion_larga}
                  onChange={(e) => setFormData({ ...formData, descripcion_larga: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              {/* Categorías */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría *</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => {
                      setFormData({ ...formData, categoria_id: e.target.value, subcategoria_id: '' });
                    }}
                    className="w-full border rounded-lg p-2"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subcategoría</label>
                  <select
                    value={formData.subcategoria_id}
                    onChange={(e) => setFormData({ ...formData, subcategoria_id: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    disabled={!formData.categoria_id}
                  >
                    <option value="">Seleccionar subcategoría</option>
                    {subcategoriasFiltradas.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Marca</label>
                  <select
                    value={formData.marca_id}
                    onChange={(e) => setFormData({ ...formData, marca_id: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Seleccionar marca</option>
                    {marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unidad de Medida */}
              <div>
                <label className="block text-sm font-medium mb-1">Unidad de Medida</label>
                <select
                  value={formData.unidad_medida_id}
                  onChange={(e) => setFormData({ ...formData, unidad_medida_id: e.target.value })}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Seleccionar unidad de medida</option>
                  {unidadesMedida.map((um) => (
                    <option key={um.id} value={um.id}>{um.nombre} ({um.abreviatura})</option>
                  ))}
                </select>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Costo (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_costo}
                    onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Venta (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              {/* Oferta */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Oferta</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_oferta}
                    onChange={(e) => setFormData({ ...formData, precio_oferta: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Inicio Oferta</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio_oferta}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio_oferta: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fin Oferta</label>
                  <input
                    type="date"
                    value={formData.fecha_fin_oferta}
                    onChange={(e) => setFormData({ ...formData, fecha_fin_oferta: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Dimensiones */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ancho (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ancho}
                    onChange={(e) => setFormData({ ...formData, ancho: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alto (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.alto}
                    onChange={(e) => setFormData({ ...formData, alto: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Profundidad (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.profundidad}
                    onChange={(e) => setFormData({ ...formData, profundidad: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>

              {/* Imágenes del producto - Solo se muestra cuando se edita */}
              {editingProducto && (
              <div>
                <label className="block text-sm font-medium mb-1">Imágenes del producto</label>
                
                {/* Mostrar imágenes existentes */}
              {imagenesProducto.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {imagenesProducto.map((img) => (
                    <div key={img.id} className="relative group border rounded-lg p-1">
                      <img
                        src={img.url}  // Esto funciona con base64 también
                        alt="Producto"
                        className="w-full h-24 object-cover rounded"
                      />
                      
                      {/* Botón eliminar */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('¿Eliminar esta imagen?')) {
                            try {
                              await apiClient.delete(`/productos/imagenes/${img.id}`);
                              notify('Imagen eliminada', 'success');
                              await cargarImagenesProducto(editingProducto!.id);
                              cargarProductos();
                            } catch (error) {
                              console.error('Error eliminando imagen:', error);
                              notify('Error al eliminar imagen', 'error');
                            }
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                      
                      {/* Botón principal */}
                      {!img.es_principal && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await apiClient.put(`/productos/imagenes/${img.id}/principal`);
                              notify('Imagen establecida como principal', 'success');
                              await cargarImagenesProducto(editingProducto!.id);
                              cargarProductos();
                            } catch (error) {
                              console.error('Error al establecer principal:', error);
                              notify('Error al establecer imagen principal', 'error');
                            }
                          }}
                          className="absolute bottom-1 right-1 bg-gray-500 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition hover:bg-blue-500"
                          title="Establecer como principal"
                        >
                          Principal
                        </button>
                      )}
                      
                      {/* Indicador de imagen principal */}
                      {img.es_principal && (
                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

                {/* Subir nuevas imágenes */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      
                      const formData = new FormData();
                      files.forEach(file => formData.append('imagenes', file));
                      
                      try {
                        const productoId = editingProducto?.id;
                        if (productoId) {
                          await apiClient.post(`/productos/${productoId}/imagenes`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          });
                          notify('Imagenes subidas correctamente', 'success');
                          await cargarImagenesProducto(productoId);
                          cargarProductos(); // Recargar lista de productos
                        } else {
                          notify('Primero guarda el producto para poder subir imagenes', 'info');
                        }
                      } catch (error: any) {
                        console.error('Error subiendo imágenes:', error);
                        notify(error.response?.data?.message || 'Error al subir imagenes', 'error');
                      }
                      
                      // Limpiar el input
                      e.target.value = '';
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    📸 Subir imágenes
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB cada una</p>
                </div>
              </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProducto ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}