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
      { title: 'Ventas del período', value: `S/ ${Number(k.ventas_totales_monto || 0).toFixed(2)}`, sub: `${k.ventas_totales_ordenes} órdenes`, icon: DollarSign, gradient: 'from-emerald-500 to-emerald-600', bgGradient: 'from-emerald-50 to-emerald-100' },
      { title: 'Ticket promedio', value: `S/ ${Number(k.ticket_promedio || 0).toFixed(2)}`, sub: 'Promedio por orden', icon: ShoppingBag, gradient: 'from-blue-500 to-blue-600', bgGradient: 'from-blue-50 to-blue-100' },
      { title: 'Conversión', value: `${Number(k.tasa_conversion || 0).toFixed(2)}%`, sub: 'Visitas a compra', icon: Users, gradient: 'from-violet-500 to-violet-600', bgGradient: 'from-violet-50 to-violet-100' },
      { title: 'Abandono carrito', value: `${Number(k.tasa_abandono_carrito || 0).toFixed(2)}%`, sub: `${k.ordenes_pendientes} pendientes`, icon: ShoppingCart, gradient: 'from-amber-500 to-amber-600', bgGradient: 'from-amber-50 to-amber-100' },
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
      <div className="flex items-center justify-center h-full py-32">
        <div className="text-center animate-scale-in">
          <div className="inline-block w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin-slow mb-6 shadow-glow"></div>
          <p className="text-slate-600 text-xl font-semibold">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-8 animate-slide-up">
        <h1 className="text-4xl font-black text-slate-900 mb-8">Dashboard Admin</h1>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-8 mb-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="text-rose-500 mt-1">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <p className="font-black text-lg mb-2">Error al cargar</p>
              <p className="text-base">{errorMsg}</p>
            </div>
          </div>
        </div>
        <button onClick={cargarStats} className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-105 transition-all">
          <RefreshCw className="w-5 h-5" /> Reintentar
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 animate-slide-up">
        <h1 className="text-4xl font-black text-slate-900 mb-8">Dashboard Admin</h1>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-3xl p-8 shadow-soft">
          <p className="text-xl font-semibold">No hay datos disponibles para el rango seleccionado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-6">
        <h1 className="text-4xl font-black text-slate-900">Dashboard Admin</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-soft p-3 rounded-2xl shadow-soft border border-white/70">
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)} 
              className="border border-slate-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-medium" 
            />
            <span className="text-slate-500 font-semibold">a</span>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)} 
              className="border border-slate-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-medium" 
            />
          </div>
          <button 
            onClick={cargarStats} 
            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-105 transition-all"
          >
            <RefreshCw className="w-5 h-5" /> Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card, index) => (
          <div key={card.title} className="bg-white/85 backdrop-blur-soft rounded-3xl shadow-soft border border-white/70 p-8 hover:shadow-glow hover:scale-102 transition-all" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-500 text-base font-semibold mb-2">{card.title}</p>
                <p className="text-4xl font-black text-slate-900 mb-2">{card.value}</p>
                <p className="text-base text-slate-500 font-medium">{card.sub}</p>
              </div>
              <div className={`bg-gradient-to-br ${card.bgGradient} p-6 rounded-3xl shadow-soft`}>
                <card.icon className={`w-10 h-10 bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white/85 backdrop-blur-soft rounded-3xl shadow-soft border border-white/70 p-8 hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">Evolución de ventas y pronóstico</h3>
            <TrendingUp className="w-7 h-7 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...(stats?.estadisticas_descriptivas?.ventas_mensuales || [])].sort((a, b) => parseMesKey(a.mes) - parseMesKey(b.mes))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="ingresos" stroke="#0ea5e9" fill="#bae6fd" strokeWidth={4} />
                <Line type="monotone" dataKey="promedio_movil_3m" stroke="#f97316" dot={false} strokeWidth={3} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="regresion" stroke="#10b981" dot={false} strokeWidth={3} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-soft rounded-3xl shadow-soft border border-white/70 p-8 hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">Ventas por categoría (Top 5)</h3>
            <Package className="w-7 h-7 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.ingresos_por_categoria || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="categoria" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="monto" fill="url(#colorGradient)" radius={[12, 12, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-soft rounded-3xl shadow-soft border border-white/70 p-8 hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">Distribución de órdenes por estado</h3>
            <ShoppingBag className="w-7 h-7 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.ordenes_por_estado || []} dataKey="cantidad" nameKey="estado" outerRadius={110} label>
                  {(stats?.ordenes_por_estado || []).map((_entry: any, index: number) => (
                    <Cell key={`estado-${index}`} fill={['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#6b7280'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-soft rounded-3xl shadow-soft border border-white/70 p-8 hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">Ingresos vs costos mensuales</h3>
            <DollarSign className="w-7 h-7 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...(stats?.ingresos_vs_costos_mensual || [])].sort((a, b) => parseMesKey(a.mes) - parseMesKey(b.mes))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="ingresos" stackId="a" fill="#10b981" radius={[12, 12, 0, 0]} />
                <Bar dataKey="costos" stackId="a" fill="#f97316" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-soft rounded-3xl shadow-soft border border-white/70 p-8 hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">Tasa de abandono de carrito</h3>
            <ArrowDownRight className="w-7 h-7 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...(stats?.tendencia_abandono || [])].sort((a, b) => a.fecha.localeCompare(b.fecha))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="abandono" stroke="#ef4444" strokeWidth={4} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-soft rounded-3xl shadow-soft border border-white/70 p-8 hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">Top 10 productos vendidos</h3>
            <ArrowUpRight className="w-7 h-7 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.top_productos || []} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} />
                <YAxis type="category" dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} width={200} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="cantidad" fill="url(#barGradient)" radius={[0, 12, 12, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563eb"/>
                    <stop offset="100%" stopColor="#4f46e5"/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-soft rounded-3xl shadow-soft border border-white/70 p-8 xl:col-span-2 hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">Embudo de conversión</h3>
            <TrendingUp className="w-7 h-7 text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
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
