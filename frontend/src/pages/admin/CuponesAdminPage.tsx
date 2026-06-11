import { useEffect, useState } from 'react';
import { Sparkles, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="w-9 h-9 text-indigo-500" />
            Gestión de Cupones
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse-glow" />
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Código del cupón</label>
            <input
              className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              placeholder="Ej: CYBER20"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
            />
            <p className="text-xs text-slate-500 mt-2">Texto que ingresará el cliente al pagar.</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de descuento</label>
            <select 
              className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              value={form.tipo} 
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="fijo">Monto fijo (S/)</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">Porcentaje aplica en %, fijo descuenta un monto exacto.</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {form.tipo === 'porcentaje' ? 'Valor del descuento (%)' : 'Valor del descuento (S/)'}
            </label>
            <input
              className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              type="number"
              min={0}
              placeholder={form.tipo === 'porcentaje' ? 'Ej: 20' : 'Ej: 15'}
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Monto mínimo de compra (S/)</label>
            <input
              className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              type="number"
              min={0}
              placeholder="Ej: 100"
              value={form.monto_minimo}
              onChange={(e) => setForm({ ...form, monto_minimo: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500 mt-2">El cupón solo aplica desde ese subtotal.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha de inicio</label>
              <input 
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                type="date" 
                value={form.fecha_inicio} 
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha de fin</label>
              <input 
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                type="date" 
                value={form.fecha_fin} 
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Límite de usos</label>
            <input
              className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              type="number"
              min={1}
              placeholder="Ej: 100"
              value={form.usos_maximos}
              onChange={(e) => setForm({ ...form, usos_maximos: Number(e.target.value) })}
            />
            <p className="text-xs text-slate-500 mt-2">Cantidad máxima de veces que se puede usar.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-start">
        <button 
          onClick={guardar} 
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-amber-500 text-white rounded-xl hover:from-indigo-700 hover:to-amber-600 transition-all duration-300 font-semibold hover:scale-105 shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Crear Cupón
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-500/10 to-amber-500/10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Usos</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Activo</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedCupones.map((c, index) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-gradient-to-r from-indigo-500/5 to-amber-500/5 transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4 font-mono text-sm font-medium text-slate-700">{c.codigo}</td>
                  <td className="px-6 py-4 text-slate-600">{c.tipo}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">{Number(c.valor).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{c.usos_actuales}/{c.usos_maximos || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${c.activo ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'}`}>
                      {c.activo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-2 text-amber-600 hover:text-amber-700 hover:bg-gradient-to-r from-amber-100 to-yellow-50 rounded-xl transition-all duration-300 hover:scale-110"
                        onClick={async () => {
                          await cuponApi.actualizarCupon(c.id, { activo: !c.activo });
                          await cargar();
                        }}
                      >
                        {c.activo ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                      </button>
                      <button
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-gradient-to-r from-red-100 to-rose-50 rounded-xl transition-all duration-300 hover:scale-110"
                        onClick={async () => {
                          await cuponApi.eliminarCupon(c.id);
                          await cargar();
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
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
        totalItems={cupones.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}
