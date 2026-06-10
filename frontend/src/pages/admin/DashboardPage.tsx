import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Package, ShoppingBag, Users, RefreshCw, ArrowUpRight, ArrowDownRight, TrendingUp, ShoppingCart } from 'lucide-react';
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
      { title: 'Ventas del período', value: `S/ ${Number(k.ventas_totales_monto || 0).toFixed(2)}`, sub: `${k.ventas_totales_ordenes} órdenes`, icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      { title: 'Ticket promedio', value: `S/ ${Number(k.ticket_promedio || 0).toFixed(2)}`, sub: 'Promedio por orden', icon: ShoppingBag, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { title: 'Conversión', value: `${Number(k.tasa_conversion || 0).toFixed(2)}%`, sub: 'Visitas a compra', icon: Users, color: 'text-violet-600', bgColor: 'bg-violet-50' },
      { title: 'Abandono carrito', value: `${Number(k.tasa_abandono_carrito || 0).toFixed(2)}%`, sub: `${k.ordenes_pendientes} pendientes`, icon: ShoppingCart, color: 'text-amber-600', bgColor: 'bg-amber-50' },
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
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Admin</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-red-500 mt-1">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold mb-1">Error al cargar</p>
              <p className="text-sm">{errorMsg}</p>
            </div>
          </div>
        </div>
        <button onClick={cargarStats} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Admin</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-6">
          No hay datos disponibles para el rango seleccionado.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)} 
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
            />
            <span className="text-gray-500">a</span>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)} 
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
            />
          </div>
          <button 
            onClick={cargarStats} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm font-medium mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-sm text-gray-500">{card.sub}</p>
              </div>
              <div className={`${card.bgColor} p-4 rounded-2xl`}>
                <card.icon className={`w-8 h-8 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Evolución de ventas y pronóstico</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...(stats?.estadisticas_descriptivas?.ventas_mensuales || [])].sort((a, b) => parseMesKey(a.mes) - parseMesKey(b.mes))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="ingresos" stroke="#0ea5e9" fill="#bae6fd" strokeWidth={3} />
                <Line type="monotone" dataKey="promedio_movil_3m" stroke="#f97316" dot={false} strokeWidth={2} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="regresion" stroke="#10b981" dot={false} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ventas por categoría (Top 5)</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.ingresos_por_categoria || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="categoria" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="monto" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Distribución de órdenes por estado</h3>
            <ShoppingBag className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.ordenes_por_estado || []} dataKey="cantidad" nameKey="estado" outerRadius={100} label>
                  {(stats?.ordenes_por_estado || []).map((_entry: any, index: number) => (
                    <Cell key={`estado-${index}`} fill={['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#6b7280'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ingresos vs costos mensuales</h3>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...(stats?.ingresos_vs_costos_mensual || [])].sort((a, b) => parseMesKey(a.mes) - parseMesKey(b.mes))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="ingresos" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="costos" stackId="a" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tasa de abandono de carrito</h3>
            <ArrowDownRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...(stats?.tendencia_abandono || [])].sort((a, b) => a.fecha.localeCompare(b.fecha))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="abandono" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top 10 productos vendidos</h3>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.top_productos || []} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={170} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="cantidad" fill="#2563eb" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Embudo de conversión</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Funnel dataKey="value" data={funnelData} isAnimationActive />
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
