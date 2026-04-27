import { useState, useEffect } from 'react';
import { Search, User, Ban, CheckCircle } from 'lucide-react';
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
    { value: 'nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
    { value: 'recurrente', label: 'Recurrente', color: 'bg-green-100 text-green-800' },
    { value: 'vip', label: 'VIP', color: 'bg-purple-100 text-purple-800' },
    { value: 'inactivo', label: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
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

  if (loading) return <div className="text-center py-12">Cargando clientes...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filtroSegmento}
          onChange={(e) => setFiltroSegmento(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option value="">Todos los segmentos</option>
          {segmentos.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-right">Total gastado</th>
              <th className="px-4 py-3 text-center">Segmento</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClientes.map((cliente) => (
              <tr key={cliente.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{cliente.usuario.email}</td>
                <td className="px-4 py-3">{cliente.telefono || '-'}</td>
                <td className="px-4 py-3 text-right font-medium">S/ {cliente.total_gastado.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${segmentos.find(s => s.value === cliente.segmento)?.color || 'bg-gray-100'}`}>
                    {cliente.segmento}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${cliente.usuario.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cliente.usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => { setSelectedCliente(cliente); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => desactivarCliente(cliente.id, cliente.usuario.activo)}
                      className={cliente.usuario.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                    >
                      {cliente.usuario.activo ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
        totalItems={filteredClientes.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Modal detalle cliente */}
      {showModal && selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Detalle del Cliente</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="font-medium">Email:</label> <p>{selectedCliente.usuario.email}</p></div>
                <div><label className="font-medium">Teléfono:</label> <p>{selectedCliente.telefono || '-'}</p></div>
                <div><label className="font-medium">Total gastado:</label> <p>S/ {selectedCliente.total_gastado.toFixed(2)}</p></div>
                <div><label className="font-medium">Última compra:</label> <p>{selectedCliente.fecha_ultima_compra ? new Date(selectedCliente.fecha_ultima_compra).toLocaleDateString() : '-'}</p></div>
                <div><label className="font-medium">Fecha registro:</label> <p>{new Date(selectedCliente.usuario.created_at).toLocaleDateString()}</p></div>
                <div><label className="font-medium">Segmento:</label> <p>{selectedCliente.segmento}</p></div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Últimas órdenes</h3>
                {selectedCliente.ordenes?.slice(0, 5).map((orden: any) => (
                  <div key={orden.id} className="flex justify-between border-b py-2">
                    <span>{orden.orden_numero}</span>
                    <span>S/ {orden.total.toFixed(2)}</span>
                    <span>{new Date(orden.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}