import { useState, useEffect } from 'react';
import { Search, Eye, Truck, Printer, RefreshCw } from 'lucide-react';
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
  { value: 'pendiente_pago', label: 'Pendiente pago', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pagada', label: 'Pagada', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_proceso', label: 'En proceso', color: 'bg-purple-100 text-purple-800' },
  { value: 'enviada', label: 'Enviada', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'entregada', label: 'Entregada', color: 'bg-green-100 text-green-800' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  { value: 'devuelta', label: 'Devuelta', color: 'bg-gray-100 text-gray-800' },
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

  if (loading) return <div className="text-center py-12">Cargando órdenes...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
        <button onClick={cargarOrdenes} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option value="">Todos los estados</option>
          {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="border rounded-lg p-2"
        />
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">N° Orden</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Fecha</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrdenes.map((orden) => {
                const estadoNormalizado = normalizarEstado(orden.estado);
                const esFinal = ['cancelada', 'devuelta'].includes(estadoNormalizado);
                return (
              <tr key={orden.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm">{orden.orden_numero}</td>
                <td className="px-4 py-3">{orden.cliente?.usuario?.email || 'N/A'}</td>
                <td className="px-4 py-3 text-right font-medium">S/ {toNumber(orden.total).toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${estados.find(e => e.value === estadoNormalizado)?.color || 'bg-gray-100'}`}>
                    {estados.find(e => e.value === estadoNormalizado)?.label || orden.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm">{new Date(orden.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      disabled={esFinal}
                      onClick={() => {
                        setSelectedOrden(orden);
                        const opciones = transiciones[estadoNormalizado] || [];
                        setNuevoEstado(opciones[0] || '');
                        setShowModal(true);
                      }}
                      className={`text-blue-600 hover:text-blue-800 ${esFinal ? 'opacity-40 cursor-not-allowed' : ''}`}
                      title="Cambiar estado"
                    >
                      <Truck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => imprimirGuia(orden)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Imprimir guía"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => imprimirFactura(orden)}
                      className="text-green-600 hover:text-green-800"
                      title="Imprimir factura"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
                );
              })}
          </tbody>
        </table>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Cambiar Estado - Orden {selectedOrden.orden_numero}</h2>
            
            <div className="space-y-4">
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                className="w-full border rounded-lg p-2"
              >
                {(transiciones[normalizarEstado(selectedOrden.estado)] || []).map((estado) => (
                  <option key={estado} value={estado}>
                    {estados.find((e) => e.value === estado)?.label || estado}
                  </option>
                ))}
              </select>
              {(transiciones[normalizarEstado(selectedOrden.estado)] || []).length === 0 && (
                <p className="text-sm text-gray-500">Este pedido no admite más cambios de estado.</p>
              )}
              
              {nuevoEstado === 'devuelta' && (
                <>
                  <textarea
                    placeholder="Motivo de devolución *"
                    value={motivoDevolucion}
                    onChange={(e) => setMotivoDevolucion(e.target.value)}
                    className="w-full border rounded-lg p-2"
                    rows={2}
                    required
                  />
                  <div>
                    <label className="block text-sm mb-1">Monto de reembolso (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={reembolso}
                      onChange={(e) => setReembolso(parseFloat(e.target.value))}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button
                  onClick={() => cambiarEstado(selectedOrden.id, nuevoEstado)}
                  disabled={!nuevoEstado || (transiciones[normalizarEstado(selectedOrden.estado)] || []).length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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