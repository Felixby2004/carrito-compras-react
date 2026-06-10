import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, Search, X, Eye, Package } from 'lucide-react';
import type { Producto } from '../../types';
import apiClient from '../../api/client';
import { notify } from '../../utils/notify';
import { Pagination } from '../../components/ui/Pagination';
import { fixImageUrl } from '../../utils/images';

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
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
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
  });

  useEffect(() => {
    cargarProductos();
    cargarCatalogos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
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
        apiClient.get('/productos/categorias').catch(_err => ({ data: { data: [] } })),
        apiClient.get('/productos/subcategorias').catch(_err => ({ data: { data: [] } })),
        apiClient.get('/productos/marcas').catch(_err => ({ data: { data: [] } })),
        apiClient.get('/productos/unidades-medida').catch(_err => ({ data: { data: [] } })),
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
      let fechaInicio = formData.fecha_inicio_oferta ? new Date(formData.fecha_inicio_oferta).toISOString() : undefined;
      let fechaFin = formData.fecha_fin_oferta ? new Date(formData.fecha_fin_oferta).toISOString() : undefined;
      
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
        notify('Producto actualizado exitosamente', 'success');
      } else {
        await apiClient.post('/productos', data);
        notify('Producto creado exitosamente', 'success');
      }
      
      setShowModal(false);
      setEditingProducto(null);
      resetForm();
      await cargarProductos();
    } catch (error: any) {
      console.error('Error guardando producto:', error);
      notify(error.response?.data?.message || 'Error al guardar producto', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await apiClient.delete(`/productos/${id}`);
        notify('Producto eliminado exitosamente', 'success');
        await cargarProductos();
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
    });
    setImageUrlInput('');
    setImagenesProducto([]);
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

  const agregarImagenViaUrl = async () => {
    if (!imageUrlInput || !editingProducto) return;
    
    try {
      await apiClient.post(`/productos/${editingProducto.id}/imagenes/url`, { url: imageUrlInput });
      notify('Imagen agregada exitosamente', 'success');
      setImageUrlInput('');
      await cargarImagenesProducto(editingProducto.id);
      await cargarProductos();
    } catch (error: any) {
      notify(error.response?.data?.message || 'Error al agregar imagen', 'error');
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
    });
    
    await cargarImagenesProducto(producto.id);
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !editingProducto) return;

    setUploadingImages(true);

    const formData = new FormData();
    files.forEach(file => formData.append('imagenes', file));

    try {
      await apiClient.post(`/productos/${editingProducto.id}/imagenes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      notify('Imágenes subidas exitosamente', 'success');
      await cargarImagenesProducto(editingProducto.id);
      await cargarProductos();
    } catch (error: any) {
      console.error('Error subiendo imágenes:', error);
      notify(error.response?.data?.message || 'Error al subir imágenes', 'error');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      await apiClient.delete(`/productos/imagenes/${imageId}`);
      notify('Imagen eliminada exitosamente', 'success');
      await cargarImagenesProducto(editingProducto!.id);
      await cargarProductos();
    } catch (error: any) {
      console.error('Error eliminando imagen:', error);
      notify('Error al eliminar imagen', 'error');
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    try {
      await apiClient.put(`/productos/imagenes/${imageId}/principal`);
      notify('Imagen principal actualizada', 'success');
      await cargarImagenesProducto(editingProducto!.id);
      await cargarProductos();
    } catch (error: any) {
      console.error('Error actualizando imagen principal:', error);
      notify('Error al establecer imagen principal', 'error');
    }
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
    p?.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            Gestión de Productos
          </h1>
          <p className="text-gray-500 mt-1">Administra tu catálogo de productos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar producto por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProductos.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {producto.imagenes && producto.imagenes.length > 0 ? (
                          <img 
                            src={fixImageUrl(producto.imagenes[0].url)} 
                            alt={producto.nombre} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{producto.nombre}</p>
                        <p className="text-sm text-gray-500">{producto.categoria?.nombre || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{producto.sku}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    S/ {producto.precio_venta?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (producto.stock_disponible || 0) > 10 ? 'bg-green-100 text-green-700' :
                      (producto.stock_disponible || 0) > 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {producto.stock_disponible || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      producto.estado === 'activo' ? 'bg-green-100 text-green-700' :
                      producto.estado === 'inactivo' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {producto.estado === 'activo' ? 'Activo' : 
                       producto.estado === 'inactivo' ? 'Inactivo' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => window.open(`/producto/${producto.id}`, '_blank')}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(producto)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
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
        
        {filteredProductos.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay productos para mostrar</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProductos.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción Corta</label>
                <textarea
                  value={formData.descripcion_corta}
                  onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción Larga</label>
                <textarea
                  value={formData.descripcion_larga}
                  onChange={(e) => setFormData({ ...formData, descripcion_larga: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Categories & Brand */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => {
                      setFormData({ ...formData, categoria_id: e.target.value, subcategoria_id: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoría</label>
                  <select
                    value={formData.subcategoria_id}
                    onChange={(e) => setFormData({ ...formData, subcategoria_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={!formData.categoria_id}
                  >
                    <option value="">Seleccionar subcategoría</option>
                    {subcategoriasFiltradas.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                  <select
                    value={formData.marca_id}
                    onChange={(e) => setFormData({ ...formData, marca_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Seleccionar marca</option>
                    {marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit of Measurement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Medida</label>
                <select
                  value={formData.unidad_medida_id}
                  onChange={(e) => setFormData({ ...formData, unidad_medida_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccionar unidad de medida</option>
                  {unidadesMedida.map((um) => (
                    <option key={um.id} value={um.id}>{um.nombre} ({um.abreviatura})</option>
                  ))}
                </select>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Costo (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_costo}
                    onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Venta (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Offer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Oferta</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_oferta}
                    onChange={(e) => setFormData({ ...formData, precio_oferta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inicio Oferta</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio_oferta}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio_oferta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fin Oferta</label>
                  <input
                    type="date"
                    value={formData.fecha_fin_oferta}
                    onChange={(e) => setFormData({ ...formData, fecha_fin_oferta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo</label>
                  <input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ancho (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ancho}
                    onChange={(e) => setFormData({ ...formData, ancho: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alto (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.alto}
                    onChange={(e) => setFormData({ ...formData, alto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profundidad (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.profundidad}
                    onChange={(e) => setFormData({ ...formData, profundidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>

              {/* Images - Only shown when editing */}
              {editingProducto && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Imágenes del Producto</label>
                  
                  {/* Existing Images */}
                  {imagenesProducto.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {imagenesProducto.map((img) => (
                        <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                          <img
                            src={fixImageUrl(img.url)}
                            alt="Producto"
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                            title="Eliminar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          {/* Set as Main */}
                          {!img.es_principal && (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(img.id)}
                              className="absolute bottom-2 left-2 bg-white text-gray-700 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-100 font-medium"
                              title="Establecer como principal"
                            >
                              Principal
                            </button>
                          )}
                          
                          {/* Main Badge */}
                          {img.es_principal && (
                            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                              Principal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add via URL */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agregar via URL</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Pega la URL de la imagen..."
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={agregarImagenViaUrl}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImages}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <div className="text-2xl">📸</div>
                      </div>
                      {uploadingImages ? 'Subiendo imágenes...' : 'Haz clic para subir imágenes o arrástralas aquí'}
                    </label>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG hasta 5MB cada una</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  {editingProducto ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
