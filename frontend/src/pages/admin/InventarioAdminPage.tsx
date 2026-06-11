import { useState, useEffect } from 'react';
import { Search, AlertTriangle, TrendingUp, TrendingDown, Plus, Eye, Sparkles, Package } from 'lucide-react';
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
      notify('Mercadería recibida. Stock actualizado.', 'success');
      cargarDatos();
    } catch (error) {
      console.error('Error registrando recepción:', error);
      notify(getErrorMessage(error, 'Error registrando recepción'), 'error');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center animate-slide-up">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
            <Package className="w-9 h-9 text-indigo-500" />
            Gestión de Inventario
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse-glow" />
          </h1>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {(stockBajo.length > 0 || stockAgotado.length > 0) && (
        <div className="space-y-3">
          {stockAgotado.length > 0 && (
            <div className="bg-gradient-to-r from-red-100 to-rose-100 border border-red-300 text-red-700 px-6 py-4 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <strong className="text-lg">¡Stock agotado!</strong>
                <span>{stockAgotado.length} productos sin stock.</span>
              </div>
            </div>
          )}
          {stockBajo.length > 0 && (
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 text-amber-700 px-6 py-4 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <strong className="text-lg">Stock bajo:</strong>
                <span>{stockBajo.length} productos por debajo del mínimo.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex gap-3 border-b border-slate-200">
        {[
          { id: 'stock', label: 'Stock' },
          { id: 'movimientos', label: 'Movimientos' },
          { id: 'proveedores', label: 'Proveedores' },
          { id: 'compras', label: 'Órdenes de Compra' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-gradient-to-r from-indigo-50 to-transparent'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla de Stock */}
      {activeTab === 'stock' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              />
            </div>
            <button
              onClick={() => { setModalType('ajuste'); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-amber-500 text-white rounded-xl hover:from-indigo-700 hover:to-amber-600 transition-all duration-300 font-semibold hover:scale-105 shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Ajustar Stock
            </button>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Stock Físico</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Reservado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Disponible</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Stock Mínimo</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedStock.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gradient-to-r from-indigo-500/5 to-amber-500/5 transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">{item.producto.nombre}</p>
                          <p className="text-sm text-slate-500 font-mono">{item.producto.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">{item.stock_fisico}</td>
                      <td className="px-6 py-4 text-right text-slate-700">{item.stock_reservado}</td>
                      <td className={`px-6 py-4 text-right font-bold ${
                        item.stock_disponible <= item.stock_minimo ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.stock_disponible}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">{item.stock_minimo}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{item.ubicacion_almacen || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tabla de Movimientos */}
      {activeTab === 'movimientos' && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Motivo</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedMovimientos.map((mov, index) => (
                  <tr key={mov.id} className="hover:bg-gradient-to-r from-indigo-500/5 to-amber-500/5 transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4 text-slate-700">{mov.producto?.nombre || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`flex items-center justify-center gap-2 ${
                        isMovimientoPositivo(mov) ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isMovimientoPositivo(mov)
                          ? <TrendingUp className="w-5 h-5" />
                          : <TrendingDown className="w-5 h-5" />}
                        {mov.tipo_movimiento}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{mov.cantidad}</td>
                    <td className="px-6 py-4 text-slate-700">{mov.motivo}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{new Date(mov.fecha_movimiento).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de Proveedores */}
      {activeTab === 'proveedores' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { setModalType('proveedor'); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-amber-500 text-white rounded-xl hover:from-indigo-700 hover:to-amber-600 transition-all duration-300 font-semibold hover:scale-105 shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Nuevo Proveedor
            </button>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Razón Social</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">RUC</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedProveedores.map((prov, index) => (
                    <tr key={prov.id} className="hover:bg-gradient-to-r from-indigo-500/5 to-amber-500/5 transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 text-slate-700">{prov.razon_social}</td>
                      <td className="px-6 py-4 text-slate-600">{prov.ruc}</td>
                      <td className="px-6 py-4 text-slate-700">{prov.email}</td>
                      <td className="px-6 py-4 text-slate-600">{prov.telefono}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${prov.activo ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'}`}>
                          {prov.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tabla de Órdenes de Compra */}
      {activeTab === 'compras' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { setModalType('compra'); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-amber-500 text-white rounded-xl hover:from-indigo-700 hover:to-amber-600 transition-all duration-300 font-semibold hover:scale-105 shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Nueva Orden de Compra
            </button>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">N° OC</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Proveedor</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedCompras.map((oc, index) => (
                    <tr key={oc.id} className="hover:bg-gradient-to-r from-indigo-500/5 to-amber-500/5 transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 font-mono text-sm font-medium text-slate-700">{oc.numero_oc}</td>
                      <td className="px-6 py-4 text-slate-700">{oc.proveedor?.razon_social}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">S/ {toNumber(oc.total).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                          oc.estado === 'recibida' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' :
                          oc.estado === 'enviada' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700' :
                          'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700'
                        }`}>
                          {oc.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">{new Date(oc.fecha_emision).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setOrdenDetalle(oc);
                              setShowDetalleOC(true);
                            }}
                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-xl transition-all duration-300 hover:scale-110"
                            title="Ver detalle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {oc.estado !== 'recibida' && (
                            <button
                              onClick={() => registrarRecepcion(oc.id)}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold hover:scale-105"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-scale-in">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowDetalleOC(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 border border-slate-200">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent mb-4">
              Detalle de Orden de Compra {ordenDetalle.numero_oc}
            </h2>
            <p className="text-slate-600 mb-2">Proveedor: {ordenDetalle.proveedor?.razon_social}</p>
            <p className="text-slate-600 mb-6">Estado: {ordenDetalle.estado}</p>
            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Producto</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Cantidad</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Costo unit.</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(ordenDetalle.detalles || []).map((d: any) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 text-slate-700">{d.producto?.nombre || d.producto_id}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{d.cantidad}</td>
                      <td className="px-4 py-3 text-right text-slate-700">S/ {toNumber(d.costo_unitario).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">S/ {toNumber(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-6 mt-4 border-t border-slate-200">
              <button onClick={() => setShowDetalleOC(false)} className="px-6 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl hover:bg-white/90 text-slate-700 transition-all duration-300 font-semibold hover:scale-105">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ajustes, proveedores y compras */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-scale-in">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 border border-slate-200">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent mb-6">
              {modalType === 'ajuste' && 'Ajustar Stock'}
              {modalType === 'proveedor' && 'Nuevo Proveedor'}
              {modalType === 'compra' && 'Nueva Orden de Compra'}
            </h2>

            {modalType === 'ajuste' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Producto</label>
                  <select
                    value={formData.producto_id}
                    onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map(p => <option key={p.producto_id} value={p.producto_id}>{p.producto.nombre} (Stock: {p.stock_disponible})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de ajuste</label>
                  <select
                    value={formData.tipo_ajuste}
                    onChange={(e) => setFormData({ ...formData, tipo_ajuste: e.target.value })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  >
                    <option value="positivo">Entrada (+)</option>
                    <option value="negativo">Salida (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cantidad</label>
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Motivo del ajuste</label>
                  <textarea
                    placeholder="Motivo del ajuste"
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {modalType === 'proveedor' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Razón Social</label>
                  <input
                    type="text"
                    placeholder="Razón Social"
                    value={formData.proveedor.razon_social}
                    onChange={(e) => setFormData({ ...formData, proveedor: { ...formData.proveedor, razon_social: e.target.value } })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">RUC</label>
                  <input
                    type="text"
                    placeholder="RUC"
                    value={formData.proveedor.ruc}
                    onChange={(e) => setFormData({ ...formData, proveedor: { ...formData.proveedor, ruc: e.target.value } })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.proveedor.email}
                    onChange={(e) => setFormData({ ...formData, proveedor: { ...formData.proveedor, email: e.target.value } })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={formData.proveedor.telefono}
                    onChange={(e) => setFormData({ ...formData, proveedor: { ...formData.proveedor, telefono: e.target.value } })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {modalType === 'compra' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Proveedor</label>
                  <select
                    value={formData.compra.proveedor_id}
                    onChange={(e) => setFormData({ ...formData, compra: { ...formData.compra, proveedor_id: e.target.value } })}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                  </select>
                </div>
                {formData.compra.items.map((item, index) => (
                  <div key={index} className="space-y-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Producto {index + 1}</label>
                      <select
                        value={item.producto_id}
                        onChange={(e) => {
                          const items = [...formData.compra.items];
                          items[index].producto_id = e.target.value;
                          setFormData({ ...formData, compra: { ...formData.compra, items } });
                        }}
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                      >
                        <option value="">Producto</option>
                        {productos.map((p) => (
                          <option key={`oc-${p.producto_id}`} value={p.producto_id}>
                            {p.producto.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Cantidad</label>
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
                          className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Costo unitario</label>
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
                          className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                        />
                      </div>
                    </div>
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
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Agregar otro producto
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl hover:bg-white/90 text-slate-700 transition-all duration-300 font-semibold hover:scale-105">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (modalType === 'ajuste') realizarAjuste();
                  else if (modalType === 'proveedor') crearProveedor();
                  else if (modalType === 'compra') crearOrdenCompra();
                }}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-amber-500 text-white rounded-xl hover:from-indigo-700 hover:to-amber-600 transition-all duration-300 font-semibold hover:scale-105 shadow-xl"
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
