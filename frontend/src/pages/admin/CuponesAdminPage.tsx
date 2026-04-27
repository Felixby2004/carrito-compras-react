import { useEffect, useState } from 'react';
import { cuponApi } from '../../api/cupon.api';
import { Pagination } from '../../components/ui/Pagination';

export function CuponesAdminPage() {
  const [cupones, setCupones] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [form, setForm] = useState<any>({
    codigo: '',
    tipo: 'porcentaje',
    valor: 0,
    fecha_inicio: '',
    fecha_fin: '',
    monto_minimo: 0,
    usos_maximos: 100,
  });

  const cargar = async () => {
    const res = await cuponApi.getCupones();
    setCupones(res.data || []);
  };

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [cupones.length]);

  const guardar = async () => {
    await cuponApi.crearCupon(form);
    setForm({
      codigo: '',
      tipo: 'porcentaje',
      valor: 0,
      fecha_inicio: '',
      fecha_fin: '',
      monto_minimo: 0,
      usos_maximos: 100,
    });
    await cargar();
  };

  const totalPages = Math.ceil(cupones.length / ITEMS_PER_PAGE);
  const paginatedCupones = cupones.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de Cupones</h1>
      <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-lg shadow mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Código del cupón</label>
          <input
            className="border p-2 rounded w-full"
            placeholder="Ej: CYBER20"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
          />
          <p className="text-xs text-gray-500 mt-1">Texto que ingresará el cliente al pagar.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de descuento</label>
          <select className="border p-2 rounded w-full" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="fijo">Monto fijo (S/)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Porcentaje aplica en %, fijo descuenta un monto exacto.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{form.tipo === 'porcentaje' ? 'Valor del descuento (%)' : 'Valor del descuento (S/)'}</label>
          <input
            className="border p-2 rounded w-full"
            type="number"
            min={0}
            placeholder={form.tipo === 'porcentaje' ? 'Ej: 20' : 'Ej: 15'}
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Monto mínimo de compra (S/)</label>
          <input
            className="border p-2 rounded w-full"
            type="number"
            min={0}
            placeholder="Ej: 100"
            value={form.monto_minimo}
            onChange={(e) => setForm({ ...form, monto_minimo: Number(e.target.value) })}
          />
          <p className="text-xs text-gray-500 mt-1">El cupón solo aplica desde ese subtotal.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de inicio</label>
          <input className="border p-2 rounded w-full" type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de fin</label>
          <input className="border p-2 rounded w-full" type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Límite de usos</label>
          <input
            className="border p-2 rounded w-full"
            type="number"
            min={1}
            placeholder="Ej: 100"
            value={form.usos_maximos}
            onChange={(e) => setForm({ ...form, usos_maximos: Number(e.target.value) })}
          />
          <p className="text-xs text-gray-500 mt-1">Cantidad máxima de veces que se puede usar.</p>
        </div>
        <button onClick={guardar} className="bg-blue-600 text-white rounded px-4 py-2">Crear Cupón</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-right">Usos</th>
              <th className="px-3 py-2 text-center">Activo</th>
              <th className="px-3 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCupones.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="px-3 py-2">{c.codigo}</td>
                <td className="px-3 py-2">{c.tipo}</td>
                <td className="px-3 py-2 text-right">{Number(c.valor).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{c.usos_actuales}/{c.usos_maximos || '-'}</td>
                <td className="px-3 py-2 text-center">{c.activo ? 'Sí' : 'No'}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    className="text-sm text-orange-600 mr-3"
                    onClick={async () => {
                      await cuponApi.actualizarCupon(c.id, { activo: !c.activo });
                      await cargar();
                    }}
                  >
                    {c.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    className="text-sm text-red-600"
                    onClick={async () => {
                      await cuponApi.eliminarCupon(c.id);
                      await cargar();
                    }}
                  >
                    Eliminar
                  </button>
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
        totalItems={cupones.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}
