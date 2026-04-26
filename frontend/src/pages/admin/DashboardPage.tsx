import { useEffect, useState } from 'react';
import { ShoppingBag, Package, Users, DollarSign } from 'lucide-react';
import apiClient from '../../api/client';

export function DashboardPage() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalOrdenes: 0,
    totalClientes: 0,
    ventasTotales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarStats();
  }, []);

  const cargarStats = async () => {
    try {
      const [productos] = await Promise.all([
        apiClient.get('/productos?limit=1'),
        // apiClient.get('/ordenes?limit=1'),
        // apiClient.get('/clientes?limit=1'),
      ]);
      setStats({
        totalProductos: productos.data.total || 0,
        totalOrdenes: 0,
        totalClientes: 0,
        ventasTotales: 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Productos', value: stats.totalProductos, icon: Package, color: 'bg-blue-500' },
    { title: 'Órdenes', value: stats.totalOrdenes, icon: ShoppingBag, color: 'bg-green-500' },
    { title: 'Clientes', value: stats.totalClientes, icon: Users, color: 'bg-purple-500' },
    { title: 'Ventas', value: `S/ ${stats.ventasTotales.toFixed(2)}`, icon: DollarSign, color: 'bg-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}