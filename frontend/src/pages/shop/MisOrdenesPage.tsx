import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { notify } from '../../utils/notify';

type Orden = any;

const estados = [
  { value: '', label: 'Todos' },
  { value: 'pendiente_pago', label: 'Pendiente pago' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'devuelta', label: 'Devuelta' },
];

export function MisOrdenesPage() {
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [estado, setEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (estado) p.set('estado', estado);
    if (fechaDesde) p.set('fecha_desde', fechaDesde);
    if (fechaHasta) p.set('fecha_hasta', fechaHasta);
    return p.toString();
  }, [estado, fechaDesde, fechaHasta]);

  const cargar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        notify('Inicia sesión para ver tus órdenes', 'info');
        setOrdenes([]);
        return;
      }
      const res = await fetch(`/api/v1/ordenes/mis-ordenes${qs ? `?${qs}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.message || 'No se pudieron cargar tus órdenes', 'error');
        setOrdenes([]);
        return;
      }
      setOrdenes(data.data || []);
    } catch {
      notify('No se pudieron cargar tus órdenes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const descargarFactura = async (ordenId: number, ordenNumero?: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        notify('Inicia sesión para descargar tu factura', 'info');
        return;
      }

      const res = await fetch(`/api/v1/ordenes/mis-ordenes/${ordenId}/factura`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        notify(data?.message || 'No se pudo descargar la factura', 'error');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${ordenNumero || ordenId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      notify('No se pudo descargar la factura', 'error');
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis órdenes</h1>
          <p className="text-sm text-slate-600">Filtra por estado y rango de fechas.</p>
        </div>
        <button
          onClick={cargar}
          className="px-4 py-2 rounded-lg border hover:bg-slate-50"
          disabled={loading}
        >
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full border rounded-lg p-2">
            {estados.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full border rounded-lg p-2" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full border rounded-lg p-2" />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={cargar}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            Aplicar
          </button>
          <button
            onClick={() => {
              setEstado('');
              setFechaDesde('');
              setFechaHasta('');
              setTimeout(cargar, 0);
            }}
            className="px-4 py-2 rounded-lg border hover:bg-slate-50"
            disabled={loading}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {ordenes.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-6 text-slate-700">
            No tienes órdenes para los filtros seleccionados.
          </div>
        )}

        {ordenes.map((o) => (
          <div key={o.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{o.orden_numero}</p>
              <p className="text-sm text-slate-600">
                {new Date(o.created_at || o.fecha_orden).toLocaleString()} · Estado: <span className="font-medium">{o.estado}</span>
              </p>
              <p className="text-sm text-slate-600">
                Items: {o.items?.length || 0} · Total: <span className="font-semibold">S/ {Number(o.total || 0).toFixed(2)}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/mis-ordenes/${o.id}`} className="px-3 py-2 rounded-lg border hover:bg-slate-50">
                Ver detalle
              </Link>
              <button
                onClick={() => descargarFactura(o.id, o.orden_numero)}
                className="px-3 py-2 rounded-lg border hover:bg-slate-50"
              >
                Descargar PDF
              </button>
              <Link to={`/mis-ordenes/${o.id}#tracking`} className="px-3 py-2 rounded-lg border hover:bg-slate-50">
                Tracking
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

