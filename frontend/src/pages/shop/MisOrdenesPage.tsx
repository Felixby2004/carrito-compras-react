import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { notify } from '../../utils/notify';

// --- Constants & Types ---
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
} as const;

interface Estado {
  value: string;
  label: string;
  color: string;
}

interface OrdenItem {
  id: number;
  producto_id: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
}

interface DireccionEnvio {
  id: number;
  orden_id: number;
  cliente_id: number;
  direccion_completa: string;
  departamento: string;
  ciudad: string;
  codigo_postal?: string;
  telefono: string;
  destinatario: string;
}

interface HistorialEstado {
  id: number;
  orden_id: number;
  estado_anterior?: string;
  estado_nuevo: string;
  comentario?: string;
  fecha_cambio: string;
  usuario_id?: number;
}

interface Orden {
  id: number;
  orden_numero: string;
  cliente_id: number;
  cupon_id?: number;
  metodo_envio_id?: number;
  fecha_orden: string;
  subtotal: number | string;
  impuesto: number | string;
  descuento: number | string;
  costo_envio: number | string;
  total: number | string;
  estado: string;
  metodo_pago?: string;
  tracking_numero?: string;
  fecha_entrega?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  items?: OrdenItem[];
  direccion_envio?: DireccionEnvio;
  historial_estados?: HistorialEstado[];
}

const ESTADOS: Estado[] = [
  { value: '', label: 'Todos', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { value: 'pendiente_pago', label: 'Pendiente pago', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'pagada', label: 'Pagada', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'en_proceso', label: 'En proceso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'enviada', label: 'Enviada', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'entregada', label: 'Entregada', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'devuelta', label: 'Devuelta', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

const getEstadoConfig = (estado: string): Estado => {
  return ESTADOS.find(e => e.value === estado) || {
    value: estado,
    label: estado,
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  };
};

const formatCurrency = (value: number | string): string => {
  const num = Number(value || 0);
  return `S/ ${num.toFixed(2)}`;
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'Fecha inválida';
  }
};

// --- Skeleton Component ---
const OrderSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse space-y-3">
    <div className="h-6 bg-slate-200 rounded w-1/4"></div>
    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
  </div>
);

export function MisOrdenesPage() {
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [estado, setEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // --- Date Range Validation ---
  const isDateRangeValid = useMemo(() => {
    if (!fechaDesde || !fechaHasta) return true;
    return new Date(fechaDesde) <= new Date(fechaHasta);
  }, [fechaDesde, fechaHasta]);

  // --- Query String Generation ---
  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (estado) params.set('estado', estado);
    if (fechaDesde) params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params.set('fecha_hasta', fechaHasta);
    return params.toString();
  }, [estado, fechaDesde, fechaHasta]);

  // --- Data Loading ---
  const cargar = async () => {
    if (!isDateRangeValid) {
      notify('Fecha "Desde" no puede ser posterior a "Hasta"', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        notify('Inicia sesión para ver tus órdenes', 'info');
        setOrdenes([]);
        return;
      }

      const url = `${API_URL}/ordenes/mis-ordenes${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.message || 'No se pudieron cargar tus órdenes', 'error');
        setOrdenes([]);
        return;
      }
      const arrayData = Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.ordenes) ? data.data.ordenes : []);
      setOrdenes(arrayData);
    } catch (err) {
      console.error('Error cargando órdenes:', err);
      setOrdenes([]);
      notify('No se pudieron cargar tus órdenes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Download Invoice ---
  const descargarFactura = async (ordenId: number, ordenNumero?: string) => {
    setDownloadingId(ordenId);
    let objectUrl: string | null = null;
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        notify('Inicia sesión para descargar tu factura', 'info');
        return;
      }

      const res = await fetch(`${API_URL}/ordenes/mis-ordenes/${ordenId}/factura`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        notify(data?.message || 'No se pudo descargar la factura', 'error');
        return;
      }

      const blob = await res.blob();
      objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `factura-${ordenNumero || ordenId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      notify('Factura descargada correctamente', 'success');
    } catch (err) {
      console.error('Error descargando factura:', err);
      notify('No se pudo descargar la factura', 'error');
    } finally {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
      setDownloadingId(null);
    }
  };

  // --- Effects ---
  useEffect(() => {
    cargar();
  }, [qs]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis órdenes</h1>
          <p className="text-sm text-slate-600">Filtra por estado y rango de fechas.</p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
              Actualizando…
            </>
          ) : (
            'Actualizar'
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label htmlFor="estado-filtro" className="block text-xs font-medium text-slate-600 mb-1">
            Estado
          </label>
          <select
            id="estado-filtro"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fecha-desde" className="block text-xs font-medium text-slate-600 mb-1">
            Desde
          </label>
          <input
            id="fecha-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div>
          <label htmlFor="fecha-hasta" className="block text-xs font-medium text-slate-600 mb-1">
            Hasta
          </label>
          <input
            id="fecha-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className={`w-full border rounded-lg p-2 text-slate-700 focus:ring-2 focus:border-blue-500 outline-none transition-all ${
              !isDateRangeValid ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
            }`}
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => {
              setEstado('');
              setFechaDesde('');
              setFechaHasta('');
            }}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
            disabled={loading}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Date Range Error */}
      {!isDateRangeValid && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <span className="font-semibold">⚠️</span>
          Fecha "Desde" debe ser anterior o igual a "Hasta"
        </div>
      )}

      {/* Order List */}
      <div className="space-y-3">
        {loading && (
          <>
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
          </>
        )}

        {!loading && (!Array.isArray(ordenes) || ordenes.length === 0) && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-slate-700 font-medium">No tienes órdenes para los filtros seleccionados.</p>
          </div>
        )}

        {!loading && Array.isArray(ordenes) && ordenes.map((orden) => {
          const estadoConfig = getEstadoConfig(orden.estado);
          return (
            <div
              key={`orden-${orden.id}`}
              className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 truncate">{orden.orden_numero}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoConfig.color}`}>
                    {estadoConfig.label}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {formatDate(orden.created_at || orden.fecha_orden)}
                </p>
                <p className="text-sm text-slate-600">
                  Items: {orden.items?.length || 0} · Total: <span className="font-semibold">{formatCurrency(orden.total)}</span>
                </p>
                {orden.tracking_numero && (
                  <p className="text-xs text-indigo-600 flex items-center gap-1">
                    <span>📦</span>
                    Tracking: {orden.tracking_numero}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/mis-ordenes/${orden.id}`}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
                >
                  Ver detalle
                </Link>
                <button
                  onClick={() => descargarFactura(orden.id, orden.orden_numero)}
                  disabled={downloadingId === orden.id}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {downloadingId === orden.id ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
                      Descargando…
                    </>
                  ) : (
                    'Descargar PDF'
                  )}
                </button>
                <Link
                  to={`/mis-ordenes/${orden.id}#tracking`}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
                >
                  Tracking
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
