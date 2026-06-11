import { useState, useEffect } from 'react';
import { Search, Eye, Truck, Printer, RefreshCw, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';
import { notify } from '../../utils/notify';
import { Pagination } from '../../components/ui/Pagination';

interface Orden {
  id: number;
  orden_numero: string;
  cliente: {
    usuario: { email: string };
  };
  subtotal: number | string;
  impuesto: number | string;
  descuento: number | string;
  costo_envio: number | string;
  total: number | string;
  estado: string;
  metodo_pago: string;
  created_at: string;
  items: any[];
  direccion_envio: any;
  historial_estados: any[];
}

const normalizarEstado = (estado: string) => {
  const limpio = (estado || '').toLowerCase().trim();
  if (limpio === 'cancelado') return 'cancelada';
  if (limpio === 'devuelto') return 'devuelta';
  return limpio;
};

const estados = [
  { value: 'pendiente_pago', label: 'Pendiente pago', color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700' },
  { value: 'pagada', label: 'Pagada', color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700' },
  { value: 'en_proceso', label: 'En proceso', color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700' },
  { value: 'enviada', label: 'Enviada', color: 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700' },
  { value: 'entregada', label: 'Entregada', color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700' },
  { value: 'devuelta', label: 'Devuelta', color: 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700' },
];
const transiciones: Record<string, string[]> = {
  pendiente_pago: ['pagada', 'cancelada'],
  pagada: ['en_proceso', 'cancelada', 'devuelta'],
  en_proceso: ['enviada', 'cancelada', 'devuelta'],
  enviada: ['entregada', 'devuelta'],
  entregada: ['devuelta'],
  cancelada: [],
  devuelta: [],
};

export function OrdenesAdminPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [reembolso, setReembolso] = useState(0);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const toNumber = (value: unknown) => Number(value || 0);

  useEffect(() => {
    cargarOrdenes();
  }, [filtroEstado, filtroFecha]);

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroFecha) params.append('fecha', filtroFecha);
      
      const response = await apiClient.get(`/ordenes/admin?${params.toString()}`);
      setOrdenes(response.data.data);
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    if (!motivoDevolucion && nuevoEstado === 'devuelta') {
      notify('Debes ingresar un motivo para la devolución', 'error');
      return;
    }
    
    try {
      const payload: Record<string, unknown> = {
        estado: nuevoEstado,
        comentario: `Estado cambiado a ${nuevoEstado}`,
      };
      if (nuevoEstado === 'devuelta') {
        payload.motivo_devolucion = motivoDevolucion;
        payload.reembolso = Number.isFinite(reembolso) ? reembolso : 0;
      }
      await apiClient.put(`/ordenes/admin/${ordenId}/estado`, payload);
      notify('Estado actualizado correctamente', 'success');
      setShowModal(false);
      setSelectedOrden(null);
      setNuevoEstado('');
      setMotivoDevolucion('');
      setReembolso(0);
      cargarOrdenes();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      notify('Error al cambiar estado', 'error');
    }
  };

  const imprimirGuia = (orden: Orden) => {
    const ventana = window.open('', '_blank');
    ventana?.document.write(`
      <html>
        <head>
          <title>Guía de Remisión - ${orden.orden_numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GUÍA DE REMISIÓN</h1>
            <p>N° ${orden.orden_numero}</p>
          </div>
          <div class="info">
            <p><strong>Cliente:</strong> ${orden.cliente?.usuario?.email || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${new Date(orden.created_at).toLocaleDateString()}</p>
            <p><strong>Dirección:</strong> ${orden.direccion_envio?.direccion_completa || 'N/A'}</p>
          </div>
          <table>
            <thead>
              <tr><th>Producto</th><th>Cantidad</th></tr>
            </thead>
            <tbody>
              ${orden.items.map(item => `
                <tr>
                  <td>${item.nombre_producto}</td>
                  <td>${item.cantidad}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    ventana?.document.close();
  };

  const imprimirFactura = (orden: Orden) => {
    const ventana = window.open('', '_blank');
    ventana?.document.write(`
      <html>
        <head>
          <title>Factura - ${orden.orden_numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .factura-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totales { text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FACTURA ELECTRÓNICA</h1>
            <p>RUC: 12345678901</p>
            <p>N° ${orden.orden_numero}</p>
          </div>
          <div class="factura-info">
            <div>
              <p><strong>Cliente:</strong> ${orden.cliente?.usuario?.email || 'N/A'}</p>
              <p><strong>Fecha:</strong> ${new Date(orden.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Método de pago:</strong> ${orden.metodo_pago}</p>
              <p><strong>Estado:</strong> ${orden.estado}</p>
            </div>
          </div>
          <table>
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
            <tbody>
              ${orden.items.map(item => `
                <tr>
                  <td>${item.nombre_producto}</td>
                  <td>${item.cantidad}</td>
                  <td>S/ ${toNumber(item.precio_unitario).toFixed(2)}</td>
                  <td>S/ ${toNumber(item.subtotal).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totales">
            <p>Subtotal: S/ ${toNumber(orden.subtotal).toFixed(2)}</p>
            <p>Envío: S/ ${toNumber(orden.costo_envio).toFixed(2)}</p>
            <p>Impuesto (18%): S/ ${toNumber(orden.impuesto).toFixed(2)}</p>
            <p><strong>Total: S/ ${toNumber(orden.total).toFixed(2)}</strong></p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    ventana?.document.close();
  };

  const filteredOrdenes = ordenes.filter(o =>
    o.orden_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cliente?.usuario?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrdenes.length / ITEMS_PER_PAGE);
  const paginatedOrdenes = filteredOrdenes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Resetear página al buscar/filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroEstado, filtroFecha]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center animate-slide-up">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
            <Truck className="w-9 h-9 text-indigo-500" />
            Gestión de Pedidos
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse-glow" />
          </h1>
        </div>
        <button 
          onClick={cargarOrdenes} 
          className="flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl hover:bg-white/90 text-slate-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <RefreshCw className="w-5 h-5" /> 
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
        >
          <option value="">Todos los estados</option>
          {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
        />
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">N° Orden</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedOrdenes.map((orden, index) => {
                const estadoNormalizado = normalizarEstado(orden.estado);
                const esFinal = ['cancelada', 'devuelta'].includes(estadoNormalizado);
                return (
                  <tr 
                    key={orden.id} 
                    className="hover:bg-gradient-to-r from-indigo-500/5 to-amber-500/5 transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 font-mono text-sm font-medium text-slate-600">{orden.orden_numero}</td>
                    <td className="px-6 py-4 text-slate-700">{orden.cliente?.usuario?.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">S/ {toNumber(orden.total).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${estados.find(e => e.value === estadoNormalizado)?.color || 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700'}`}>
                        {estados.find(e => e.value === estadoNormalizado)?.label || orden.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">{new Date(orden.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          disabled={esFinal}
                          onClick={() => {
                            setSelectedOrden(orden);
                            const opciones = transiciones[estadoNormalizado] || [];
                            setNuevoEstado(opciones[0] || '');
                            setShowModal(true);
                          }}
                          className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${esFinal ? 'text-slate-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-700 hover:bg-gradient-to-r from-indigo-100 to-indigo-50'}`}
                          title="Cambiar estado"
                        >
                          <Truck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => imprimirGuia(orden)}
                          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-gradient-to-r from-slate-100 to-gray-50 rounded-xl transition-all duration-300 hover:scale-110"
                          title="Imprimir guía"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => imprimirFactura(orden)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-gradient-to-r from-green-100 to-emerald-50 rounded-xl transition-all duration-300 hover:scale-110"
                          title="Imprimir factura"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredOrdenes.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Modal cambio de estado */}
      {showModal && selectedOrden && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-scale-in">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" 
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-200">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent mb-6">
              Cambiar Estado - Orden {selectedOrden.orden_numero}
            </h2>
            
            <div className="space-y-4">
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              >
                {(transiciones[normalizarEstado(selectedOrden.estado)] || []).map((estado) => (
                  <option key={estado} value={estado}>
                    {estados.find((e) => e.value === estado)?.label || estado}
                  </option>
                ))}
              </select>
              {(transiciones[normalizarEstado(selectedOrden.estado)] || []).length === 0 && (
                <p className="text-sm text-slate-500">Este pedido no admite más cambios de estado.</p>
              )}
              
              {nuevoEstado === 'devuelta' && (
                <>
                  <textarea
                    placeholder="Motivo de devolución *"
                    value={motivoDevolucion}
                    onChange={(e) => setMotivoDevolucion(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                    rows={2}
                    required
                  />
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Monto de reembolso (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reembolso}
                      onChange={(e) => setReembolso(parseFloat(e.target.value))}
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl hover:bg-white/90 text-slate-700 transition-all duration-300 font-semibold hover:scale-105"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => cambiarEstado(selectedOrden.id, nuevoEstado)}
                  disabled={!nuevoEstado || (transiciones[normalizarEstado(selectedOrden.estado)] || []).length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-amber-500 text-white rounded-xl hover:from-indigo-700 hover:to-amber-600 transition-all duration-300 font-semibold hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
