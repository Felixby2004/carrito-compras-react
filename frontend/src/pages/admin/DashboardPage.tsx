import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Package, ShoppingBag, Users, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarStats();
  }, [fechaDesde, fechaHasta]);

  const cargarStats = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await apiClient.get(`/dashboard/analytics?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setStats(null);
      setErrorMsg('No se pudo cargar el dashboard. Verifica permisos de tu usuario o vuelve a iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(() => {
    if (!stats?.kpis) return [];
    const k = stats.kpis;
    return [
      { title: 'Ventas del período', value: `S/ ${Number(k.ventas_totales_monto || 0).toFixed(2)}`, sub: `${k.ventas_totales_ordenes} órdenes`, icon: DollarSign, color: 'bg-emerald-500' },
      { title: 'Ticket promedio', value: `S/ ${Number(k.ticket_promedio || 0).toFixed(2)}`, sub: 'Promedio por orden', icon: ShoppingBag, color: 'bg-blue-500' },
      { title: 'Conversión', value: `${Number(k.tasa_conversion || 0).toFixed(2)}%`, sub: 'Visitas a compra', icon: Users, color: 'bg-violet-500' },
      { title: 'Abandono carrito', value: `${Number(k.tasa_abandono_carrito || 0).toFixed(2)}%`, sub: `${k.ordenes_pendientes} pendientes`, icon: Package, color: 'bg-amber-500' },
    ];
  }, [stats]);

  const funnelData = useMemo(() => {
    if (!stats?.funnel) return [];
    return [
      { value: stats.funnel.visitas, name: 'Visitas' },
      { value: stats.funnel.carrito, name: 'Carrito' },
      { value: stats.funnel.checkout, name: 'Checkout' },
      { value: stats.funnel.pago, name: 'Pago' },
    ];
  }, [stats]);

  const parseMesKey = (value: string) => {
    if (!value) return 0;
    const normalized = value.includes('/') ? value.split('/').reverse().join('-') : value;
    const parsed = Date.parse(`${normalized}-01`);
    return Number.isNaN(parsed) ? Date.parse(value) || 0 : parsed;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">{errorMsg}</div>
        <button onClick={cargarStats} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-4">
          No hay datos disponibles para el rango seleccionado.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          <button onClick={cargarStats} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-4 min-w-0">
          <h3 className="font-semibold mb-3">Evolución de ventas y pronóstico</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...(stats?.estadisticas_descriptivas?.ventas_mensuales || [])].sort((a, b) => parseMesKey(a.mes) - parseMesKey(b.mes))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="ingresos" stroke="#0ea5e9" fill="#bae6fd" />
                <Line type="monotone" dataKey="promedio_movil_3m" stroke="#f97316" dot={false} />
                <Line type="monotone" dataKey="regresion" stroke="#10b981" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 min-w-0">
          <h3 className="font-semibold mb-3">Ventas por categoría (Top 5)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.ingresos_por_categoria || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="monto" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 min-w-0">
          <h3 className="font-semibold mb-3">Distribución de órdenes por estado</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.ordenes_por_estado || []} dataKey="cantidad" nameKey="estado" outerRadius={100} label>
                  {(stats?.ordenes_por_estado || []).map((_entry: any, index: number) => (
                    <Cell key={`estado-${index}`} fill={['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#6b7280'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 min-w-0">
          <h3 className="font-semibold mb-3">Ingresos vs costos mensuales</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...(stats?.ingresos_vs_costos_mensual || [])].sort((a, b) => parseMesKey(a.mes) - parseMesKey(b.mes))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ingresos" stackId="a" fill="#10b981" />
                <Bar dataKey="costos" stackId="a" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 min-w-0">
          <h3 className="font-semibold mb-3">Tasa de abandono de carrito</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...(stats?.tendencia_abandono || [])].sort((a, b) => a.fecha.localeCompare(b.fecha))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="abandono" stroke="#ef4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 min-w-0">
          <h3 className="font-semibold mb-3">Top 10 productos vendidos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.top_productos || []} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="nombre" width={160} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 xl:col-span-2 min-w-0">
          <h3 className="font-semibold mb-3">Embudo de conversión</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnelData} isAnimationActive />
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}