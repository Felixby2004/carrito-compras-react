import { useState, useEffect } from 'react';
import { Search, User, Ban, CheckCircle, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';
import { notify } from '../../utils/notify';
import { Pagination } from '../../components/ui/Pagination';

interface Cliente {
  id: number;
  usuario: { email: string; activo: boolean; created_at: string };
  telefono: string;
  total_gastado: number;
  fecha_ultima_compra: string;
  segmento: string;
  ordenes: any[];
}

export function ClientesAdminPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    cargarClientes();
  }, [filtroSegmento]);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroSegmento) params.append('segmento', filtroSegmento);
      const response = await apiClient.get(`/clientes/admin?${params.toString()}`);
      setClientes(response.data.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const desactivarCliente = async (clienteId: number, activo: boolean) => {
    try {
      await apiClient.put(`/clientes/${clienteId}/estado`, { activo: !activo });
      notify(activo ? 'Cliente desactivado' : 'Cliente activado', 'success');
      cargarClientes();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const segmentos = [
    { value: 'nuevo', label: 'Nuevo', color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700' },
    { value: 'recurrente', label: 'Recurrente', color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' },
    { value: 'vip', label: 'VIP', color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700' },
    { value: 'inactivo', label: 'Inactivo', color: 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700' },
  ];

  const filteredClientes = clientes.filter(c =>
    c.usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono?.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredClientes.length / ITEMS_PER_PAGE);
  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Resetear página al buscar/filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroSegmento]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center animate-slide-up">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
            <User className="w-9 h-9 text-indigo-500" />
            Gestión de Clientes
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse-glow" />
          </h1>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
          />
        </div>
        <select
          value={filtroSegmento}
          onChange={(e) => setFiltroSegmento(e.target.value)}
          className="px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
        >
          <option value="">Todos los segmentos</option>
          {segmentos.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Total gastado</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Segmento</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedClientes.map((cliente, index) => (
                <tr 
                  key={cliente.id} 
                  className="hover:bg-gradient-to-r from-indigo-500/5 to-amber-500/5 transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4 text-slate-700">{cliente.usuario.email}</td>
                  <td className="px-6 py-4 text-slate-600">{cliente.telefono || '-'}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">S/ {cliente.total_gastado.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${segmentos.find(s => s.value === cliente.segmento)?.color || 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700'}`}>
                      {cliente.segmento}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${cliente.usuario.activo ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'}`}>
                      {cliente.usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setSelectedCliente(cliente); setShowModal(true); }}
                        className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-xl transition-all duration-300 hover:scale-110"
                      >
                        <User className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => desactivarCliente(cliente.id, cliente.usuario.activo)}
                        className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${cliente.usuario.activo ? 'text-red-600 hover:text-red-700 hover:bg-gradient-to-r from-red-100 to-rose-50' : 'text-green-600 hover:text-green-700 hover:bg-gradient-to-r from-green-100 to-emerald-50'}`}
                      >
                        {cliente.usuario.activo ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredClientes.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Modal detalle cliente */}
      {showModal && selectedCliente && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-scale-in">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" 
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 border border-slate-200">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent mb-6">
              Detalle del Cliente
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <p className="text-slate-600">{selectedCliente.usuario.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                  <p className="text-slate-600">{selectedCliente.telefono || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Total gastado</label>
                  <p className="text-slate-600 font-bold">S/ {selectedCliente.total_gastado.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Última compra</label>
                  <p className="text-slate-600">{selectedCliente.fecha_ultima_compra ? new Date(selectedCliente.fecha_ultima_compra).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha registro</label>
                  <p className="text-slate-600">{new Date(selectedCliente.usuario.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Segmento</label>
                  <p className="text-slate-600">{selectedCliente.segmento}</p>
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Últimas órdenes</h3>
                {selectedCliente.ordenes?.slice(0, 5).map((orden: any) => (
                  <div key={orden.id} className="flex justify-between items-center border-b border-slate-100 py-3">
                    <span className="text-slate-700 font-medium">{orden.orden_numero}</span>
                    <span className="text-slate-800 font-bold">S/ {orden.total.toFixed(2)}</span>
                    <span className="text-slate-600">{new Date(orden.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl hover:bg-white/90 text-slate-700 transition-all duration-300 font-semibold hover:scale-105"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
