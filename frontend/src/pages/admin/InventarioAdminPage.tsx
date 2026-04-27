import { useState, useEffect } from 'react';
import { Search, AlertTriangle, TrendingUp, TrendingDown, Plus, Eye } from 'lucide-react';
import apiClient from '../../api/client';
import { notify } from '../../utils/notify';
import { Pagination } from '../../components/ui/Pagination';

interface StockProducto {
  id: number;
  producto_id: number;
  producto: {
    sku: string;
    nombre: string;
  };
  stock_fisico: number;
  stock_reservado: number;
  stock_minimo: number;
  ubicacion_almacen: string;
  stock_disponible: number;
}

interface MovimientoInventario {
  id: number;
  producto_id: number;
  producto: { nombre: string; sku: string };
  tipo_movimiento: string;
  cantidad: number;
  stock_antes?: number;
  stock_despues?: number;
  motivo: string;
  fecha_movimiento: string;
}

interface Proveedor {
  id: number;
  razon_social: string;
  ruc: string;
  email: string;
  telefono: string;
  activo: boolean;
}

interface OrdenCompra {
  id: number;
  proveedor_id: number;
  proveedor: { razon_social: string };
  numero_oc: string;
  fecha_emision: string;
  fecha_entrega_estimada: string;
  estado: string;
  total: number | string;
  detalles: any[];
}

export function InventarioAdminPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movimientos' | 'proveedores' | 'compras'>('stock');
  const [stock, setStock] = useState<StockProducto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetalleOC, setShowDetalleOC] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenCompra | null>(null);
  const [modalType, setModalType] = useState<'ajuste' | 'proveedor' | 'compra' | 'recepcion'>('ajuste');
  const [, setSelectedProducto] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    motivo: '',
    tipo_ajuste: 'positivo',
    proveedor: { razon_social: '', ruc: '', email: '', telefono: '' },
    compra: {
      proveedor_id: '',
      fecha_entrega: '',
      items: [{ producto_id: '', cantidad: '', costo_unitario: '' }] as any[],
    },
  });
  const [productos, setProductos] = useState<any[]>([]);

  const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback;
  const toNumber = (value: unknown) => Number(value || 0);
  const isMovimientoPositivo = (mov: MovimientoInventario) => {
    if (typeof mov.stock_antes === 'number' && typeof mov.stock_despues === 'number') {
      return mov.stock_despues >= mov.stock_antes;
    }
    return ['entrada', 'devolucion'].includes(mov.tipo_movimiento);
  };

  useEffect(() => {
    cargarDatos();
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stock') {
        const res = await apiClient.get('/inventario/stock');
        setStock(res.data.data);
      } else if (activeTab === 'movimientos') {
        const res = await apiClient.get('/inventario/movimientos');
        setMovimientos(res.data.data);
      } else if (activeTab === 'proveedores') {
        const res = await apiClient.get('/inventario/proveedores');
        setProveedores(res.data.data);
      } else if (activeTab === 'compras') {
        const res = await apiClient.get('/inventario/ordenes-compra');
        setOrdenesCompra(res.data.data);
      }
      const prodRes = await apiClient.get('/inventario/stock?limite=200');
      setProductos(prodRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const realizarAjuste = async () => {
    try {
      await apiClient.post('/inventario/ajustes', {
        producto_id: parseInt(formData.producto_id),
        cantidad: parseInt(formData.cantidad),
        tipo: formData.tipo_ajuste,
        motivo: formData.motivo,
      });
      notify('Ajuste de inventario realizado', 'success');
      setShowModal(false);
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error('Error realizando ajuste:', error);
      notify(getErrorMessage(error, 'Error al realizar ajuste'), 'error');
    }
  };

  const crearProveedor = async () => {
    try {
      await apiClient.post('/inventario/proveedores', formData.proveedor);
      notify('Proveedor creado', 'success');
      setShowModal(false);
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error('Error creando proveedor:', error);
      notify(getErrorMessage(error, 'Error al crear proveedor'), 'error');
    }
  };

  const crearOrdenCompra = async () => {
    try {
      const items = formData.compra.items
        .filter((it) => it.producto_id && it.cantidad && it.costo_unitario)
        .map((it) => ({
          producto_id: parseInt(it.producto_id),
          cantidad: parseInt(it.cantidad),
          costo_unitario: parseFloat(it.costo_unitario),
        }));

      await apiClient.post('/inventario/ordenes-compra', {
        proveedor_id: parseInt(formData.compra.proveedor_id),
        articulos: items,
      });
      notify('Orden de compra creada', 'success');
      setShowModal(false);
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error('Error creando orden:', error);
      notify(getErrorMessage(error, 'Error creando orden de compra'), 'error');
    }
  };

  const registrarRecepcion = async (ordenId: number) => {
    try {
      await apiClient.post(`/inventario/ordenes-compra/${ordenId}/recibir`, {});
      notify('Mercaderia recibida. Stock actualizado.', 'success');
      cargarDatos();
    } catch (error) {
      console.error('Error registrando recepción:', error);
      notify(getErrorMessage(error, 'Error registrando recepcion'), 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      producto_id: '',
      cantidad: '',
      motivo: '',
      tipo_ajuste: 'positivo',
      proveedor: { razon_social: '', ruc: '', email: '', telefono: '' },
      compra: {
        proveedor_id: '',
        fecha_entrega: '',
        items: [{ producto_id: '', cantidad: '', costo_unitario: '' }],
      },
    });
    setSelectedProducto(null);
  };

  const stockBajo = stock.filter(s => s.stock_disponible <= s.stock_minimo && s.stock_minimo > 0);
  const stockAgotado = stock.filter(s => s.stock_disponible <= 0);

  // Funciones de Paginación
  const getPaginatedData = (data: any[]) => {
    return data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  };

  const filteredStock = stock.filter(s => s.producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedStock = getPaginatedData(filteredStock);
  const paginatedMovimientos = getPaginatedData(movimientos);
  const paginatedProveedores = getPaginatedData(proveedores);
  const paginatedCompras = getPaginatedData(ordenesCompra);
  const totalItemsByTab =
    activeTab === 'stock'
      ? filteredStock.length
      : activeTab === 'movimientos'
        ? movimientos.length
        : activeTab === 'proveedores'
          ? proveedores.length
          : ordenesCompra.length;
  const totalPages = Math.ceil(totalItemsByTab / ITEMS_PER_PAGE);

  if (loading) return <div className="text-center py-12">Cargando inventario...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de Inventario</h1>

      {/* Alertas de stock bajo */}
      {(stockBajo.length > 0 || stockAgotado.length > 0) && (
        <div className="mb-6 space-y-2">
          {stockAgotado.length > 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <AlertTriangle className="inline w-5 h-5 mr-2" />
              <strong>¡Stock agotado!</strong> {stockAgotado.length} productos sin stock.
            </div>
          )}
          {stockBajo.length > 0 && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <AlertTriangle className="inline w-5 h-5 mr-2" />
              <strong>Stock bajo:</strong> {stockBajo.length} productos por debajo del mínimo.
            </div>
          )}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex gap-2 mb-6 border-b">
        {['stock', 'movimientos', 'proveedores', 'compras'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium transition ${
              activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'stock' && 'Stock'}
            {tab === 'movimientos' && 'Movimientos'}
            {tab === 'proveedores' && 'Proveedores'}
            {tab === 'compras' && 'Órdenes de Compra'}
          </button>
        ))}
      </div>

      {/* Tabla de Stock */}
      {activeTab === 'stock' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={() => { setModalType('ajuste'); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Ajustar Stock
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-right">Stock Físico</th>
                  <th className="px-4 py-3 text-right">Reservado</th>
                  <th className="px-4 py-3 text-right">Disponible</th>
                  <th className="px-4 py-3 text-right">Stock Mínimo</th>
                  <th className="px-4 py-3 text-center">Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStock.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{item.producto.nombre}</p>
                        <p className="text-xs text-gray-500">{item.producto.sku}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{item.stock_fisico}</td>
                    <td className="px-4 py-3 text-right">{item.stock_reservado}</td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      item.stock_disponible <= item.stock_minimo ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.stock_disponible}
                    </td>
                    <td className="px-4 py-3 text-right">{item.stock_minimo}</td>
                    <td className="px-4 py-3 text-center">{item.ubicacion_almacen || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tabla de Movimientos */}
      {activeTab === 'movimientos' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-center">Tipo</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-left">Motivo</th>
                <th className="px-4 py-3 text-center">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovimientos.map((mov) => (
                <tr key={mov.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{mov.producto?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`flex items-center justify-center gap-1 ${
                      isMovimientoPositivo(mov) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isMovimientoPositivo(mov)
                        ? <TrendingUp className="w-4 h-4" />
                        : <TrendingDown className="w-4 h-4" />}
                      {mov.tipo_movimiento}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{mov.cantidad}</td>
                  <td className="px-4 py-3">{mov.motivo}</td>
                  <td className="px-4 py-3 text-center">{new Date(mov.fecha_movimiento).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla de Proveedores */}
      {activeTab === 'proveedores' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setModalType('proveedor'); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Nuevo Proveedor
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Razón Social</th>
                  <th className="px-4 py-3 text-left">RUC</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProveedores.map((prov) => (
                  <tr key={prov.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{prov.razon_social}</td>
                    <td className="px-4 py-3">{prov.ruc}</td>
                    <td className="px-4 py-3">{prov.email}</td>
                    <td className="px-4 py-3">{prov.telefono}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${prov.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {prov.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tabla de Órdenes de Compra */}
      {activeTab === 'compras' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setModalType('compra'); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Nueva Orden de Compra
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">N° OC</th>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Fecha</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompras.map((oc) => (
                  <tr key={oc.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{oc.numero_oc}</td>
                    <td className="px-4 py-3">{oc.proveedor?.razon_social}</td>
                    <td className="px-4 py-3 text-right">S/ {toNumber(oc.total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        oc.estado === 'recibida' ? 'bg-green-100 text-green-700' :
                        oc.estado === 'enviada' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {oc.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{new Date(oc.fecha_emision).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setOrdenDetalle(oc);
                            setShowDetalleOC(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {oc.estado !== 'recibida' && (
                          <button
                            onClick={() => registrarRecepcion(oc.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Recibir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItemsByTab}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {showDetalleOC && ordenDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDetalleOC(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Detalle de Orden de Compra {ordenDetalle.numero_oc}</h2>
            <p className="text-sm text-gray-600 mb-2">Proveedor: {ordenDetalle.proveedor?.razon_social}</p>
            <p className="text-sm text-gray-600 mb-4">Estado: {ordenDetalle.estado}</p>
            <div className="max-h-80 overflow-y-auto border rounded">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Costo unit.</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(ordenDetalle.detalles || []).map((d: any) => (
                    <tr key={d.id} className="border-b">
                      <td className="px-3 py-2">{d.producto?.nombre || d.producto_id}</td>
                      <td className="px-3 py-2 text-right">{d.cantidad}</td>
                      <td className="px-3 py-2 text-right">S/ {toNumber(d.costo_unitario).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">S/ {toNumber(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setShowDetalleOC(false)} className="px-4 py-2 border rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ajustes, proveedores y compras */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'ajuste' && 'Ajustar Stock'}
              {modalType === 'proveedor' && 'Nuevo Proveedor'}
              {modalType === 'compra' && 'Nueva Orden de Compra'}
            </h2>

            {modalType === 'ajuste' && (
              <div className="space-y-4">
                <select
                  value={formData.producto_id}
                  onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map(p => <option key={p.producto_id} value={p.producto_id}>{p.producto.nombre} (Stock: {p.stock_disponible})</option>)}
                </select>
                <select
                  value={formData.tipo_ajuste}
                  onChange={(e) => setFormData({ ...formData, tipo_ajuste: e.target.value })}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="positivo">Entrada (+)</option>
                  <option value="negativo">Salida (-)</option>
                </select>
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
                <textarea
                  placeholder="Motivo del ajuste"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                />
              </div>
            )}

            {modalType === 'proveedor' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Razón Social"
                  value={formData.proveedor.razon_social}
                  onChange={(e) => setFormData({ ...formData, proveedor: { ...formData.proveedor, razon_social: e.target.value } })}
                  className="w-full border rounded-lg p-2"
                />
                <input
                  type="text"
                  placeholder="RUC"
                  value={formData.proveedor.ruc}
                  onChange={(e) => setFormData({ ...formData, proveedor: { ...formData.proveedor, ruc: e.target.value } })}
                  className="w-full border rounded-lg p-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.proveedor.email}
                  onChange={(e) => setFormData({ ...formData, proveedor: { ...formData.proveedor, email: e.target.value } })}
                  className="w-full border rounded-lg p-2"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={formData.proveedor.telefono}
                  onChange={(e) => setFormData({ ...formData, proveedor: { ...formData.proveedor, telefono: e.target.value } })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            )}

            {modalType === 'compra' && (
              <div className="space-y-4">
                <select
                  value={formData.compra.proveedor_id}
                  onChange={(e) => setFormData({ ...formData, compra: { ...formData.compra, proveedor_id: e.target.value } })}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                </select>
                {formData.compra.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <select
                      value={item.producto_id}
                      onChange={(e) => {
                        const items = [...formData.compra.items];
                        items[index].producto_id = e.target.value;
                        setFormData({ ...formData, compra: { ...formData.compra, items } });
                      }}
                      className="border rounded-lg p-2 col-span-2"
                    >
                      <option value="">Producto</option>
                      {productos.map((p) => (
                        <option key={`oc-${p.producto_id}`} value={p.producto_id}>
                          {p.producto.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={item.cantidad}
                      onChange={(e) => {
                        const items = [...formData.compra.items];
                        items[index].cantidad = e.target.value;
                        setFormData({ ...formData, compra: { ...formData.compra, items } });
                      }}
                      className="border rounded-lg p-2"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Costo unitario"
                      value={item.costo_unitario}
                      onChange={(e) => {
                        const items = [...formData.compra.items];
                        items[index].costo_unitario = e.target.value;
                        setFormData({ ...formData, compra: { ...formData.compra, items } });
                      }}
                      className="border rounded-lg p-2 col-span-3"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      compra: {
                        ...formData.compra,
                        items: [...formData.compra.items, { producto_id: '', cantidad: '', costo_unitario: '' }],
                      },
                    })
                  }
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Agregar otro producto
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button
                onClick={() => {
                  if (modalType === 'ajuste') realizarAjuste();
                  else if (modalType === 'proveedor') crearProveedor();
                  else if (modalType === 'compra') crearOrdenCompra();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}