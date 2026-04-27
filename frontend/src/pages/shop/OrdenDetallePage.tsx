import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { notify } from '../../utils/notify';

type Orden = any;

function badge(estado: string) {
  const base = 'px-2 py-1 rounded-full text-xs font-medium';
  if (estado === 'entregada') return `${base} bg-emerald-100 text-emerald-700`;
  if (estado === 'cancelada' || estado === 'devuelta') return `${base} bg-rose-100 text-rose-700`;
  if (estado === 'enviada') return `${base} bg-indigo-100 text-indigo-700`;
  if (estado === 'en_proceso') return `${base} bg-amber-100 text-amber-800`;
  if (estado === 'pagada') return `${base} bg-blue-100 text-blue-700`;
  return `${base} bg-slate-100 text-slate-700`;
}

export function OrdenDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [orden, setOrden] = useState<Orden | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const token = useMemo(() => localStorage.getItem('accessToken'), []);

  const cargar = async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (!token) {
        notify('Inicia sesión para ver tu orden', 'info');
        return;
      }
      const res = await fetch(`/api/v1/ordenes/mis-ordenes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.message || 'No se pudo cargar la orden', 'error');
        return;
      }
      setOrden(data.data);
    } catch {
      notify('No se pudo cargar la orden', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelar = async () => {
    if (!id) return;
    setCancelando(true);
    try {
      if (!token) {
        notify('Inicia sesión para cancelar', 'info');
        return;
      }
      const res = await fetch(`/api/v1/ordenes/mis-ordenes/${id}/cancelar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario: 'Cancelada por cliente' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.message || 'No se pudo cancelar', 'error');
        return;
      }
      notify('Orden cancelada', 'success');
      await cargar();
    } catch {
      notify('No se pudo cancelar', 'error');
    } finally {
      setCancelando(false);
    }
  };

  const cargarTracking = async () => {
    if (!id || !token) return null;
    const res = await fetch(`/api/v1/ordenes/mis-ordenes/${id}/tracking`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) return null;
    return data.data;
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !orden) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? 'Cargando…' : 'No se encontró la orden.'}
        </div>
      </div>
    );
  }

  const puedeCancelar = ['pendiente_pago', 'pagada'].includes(orden.estado);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-4">
        <Link to="/mis-ordenes" className="text-blue-600 hover:underline">
          ← Volver a mis órdenes
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{orden.orden_numero}</h1>
            <p className="text-sm text-slate-600">Fecha: {new Date(orden.created_at || orden.fecha_orden).toLocaleString()}</p>
            <p className="text-sm text-slate-600">
              Estado actual: <span className={badge(orden.estado)}>{orden.estado}</span>
            </p>
            <p className="text-sm text-slate-600">Método de pago: <span className="font-medium">{orden.metodo_pago || 'N/A'}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {puedeCancelar && (
              <button
                onClick={cancelar}
                disabled={cancelando}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelando ? 'Cancelando…' : 'Cancelar (si estás dentro de la ventana)'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Productos</h2>
            <div className="space-y-2">
              {(orden.items || []).map((it: any) => (
                <div key={it.id} className="flex justify-between gap-3 border-b last:border-b-0 py-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{it.nombre_producto}</p>
                    <p className="text-sm text-slate-600">
                      Cantidad: {it.cantidad} · Precio: S/ {Number(it.precio_unitario).toFixed(2)}
                    </p>
                  </div>
                  <div className="font-semibold">S/ {Number(it.subtotal).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>S/ {Number(orden.subtotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Impuesto</span><span>S/ {Number(orden.impuesto || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Envío</span><span>S/ {Number(orden.costo_envio || 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>S/ {Number(orden.total || 0).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6" id="timeline">
            <h2 className="text-lg font-semibold mb-3">Timeline de estados</h2>
            <div className="space-y-3">
              {(orden.historial_estados || []).length === 0 && <p className="text-sm text-slate-600">Sin cambios registrados.</p>}
              {(orden.historial_estados || []).map((h: any) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{h.estado_nuevo}</span>{' '}
                      <span className="text-slate-500">({new Date(h.fecha_cambio).toLocaleString()})</span>
                    </p>
                    {h.comentario && <p className="text-xs text-slate-600">{h.comentario}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Dirección de envío</h2>
            {orden.direccion_envio ? (
              <div className="text-sm text-slate-700 space-y-1">
                <p className="font-medium">{orden.direccion_envio.destinatario}</p>
                <p>{orden.direccion_envio.direccion_completa}</p>
                <p>{orden.direccion_envio.ciudad} {orden.direccion_envio.departamento ? `- ${orden.direccion_envio.departamento}` : ''}</p>
                <p>Tel: {orden.direccion_envio.telefono}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No disponible</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6" id="tracking">
            <h2 className="text-lg font-semibold mb-3">Seguimiento</h2>
            <p className="text-sm text-slate-600 mb-3">Tracking: <span className="font-medium">{orden.tracking_numero || 'No asignado'}</span></p>
            <button
              onClick={async () => {
                const tr = await cargarTracking();
                if (!tr) {
                  notify('No se pudo cargar tracking', 'error');
                  return;
                }
                notify(`Estado: ${tr.estado_actual} · Tracking: ${tr.tracking_numero || 'N/A'}`, 'info');
              }}
              className="w-full px-4 py-2 rounded-lg border hover:bg-slate-50"
            >
              Ver tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

