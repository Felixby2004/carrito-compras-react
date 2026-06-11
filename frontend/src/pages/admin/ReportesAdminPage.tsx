import apiClient from '../../api/client';
import { notify } from '../../utils/notify';
import { FileText, Sparkles } from 'lucide-react';

const reportesOperacionales = [
  { key: 'ordenes-periodo', label: 'Órdenes del período' },
  { key: 'inventario-valorizado', label: 'Inventario valorizado por categoría' },
  { key: 'movimientos-periodo', label: 'Movimientos de inventario' },
  { key: 'stock-bajo', label: 'Stock bajo o agotado' },
  { key: 'pagos-periodo', label: 'Pagos recibidos' },
  { key: 'devoluciones', label: 'Devoluciones y reembolsos' },
];

export function ReportesAdminPage() {
  const abrir = async (tipo: 'operacional' | 'gestion', reporte: string) => {
    try {
      const response = await apiClient.get(`/reportes/${tipo}/${reporte}`, {
        responseType: 'blob',
      });
      const blob = response.data as Blob;
      const buf = await blob.arrayBuffer();
      const header = new TextDecoder().decode(buf.slice(0, 4));
      if (header !== '%PDF') {
        const text = new TextDecoder().decode(buf.slice(0, 600));
        notify(`No se pudo generar el PDF (${tipo}/${reporte}). ${text}`.slice(0, 220), 'error');
        return;
      }
      const pdfBlob = new Blob([buf], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error: any) {
      console.error('Error generando reporte:', error);
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            notify(`Error: ${errorData.message || 'No se pudo generar el reporte'}`, 'error');
          } catch (e) {
            notify('No se pudo generar el reporte. Verifica tu sesión o permisos.', 'error');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        notify('No se pudo generar el reporte. Verifica tu sesión o permisos.', 'error');
      }
    }
  };

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="w-9 h-9 text-indigo-500" />
            Gestión de Reportes
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse-glow" />
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Reportes Operacionales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportesOperacionales.map((r, index) => (
              <button
                key={r.key}
                onClick={() => abrir('operacional', r.key)}
                className="p-4 bg-gradient-to-br from-indigo-50 to-amber-50 hover:from-indigo-100 hover:to-amber-100 border border-slate-200 rounded-xl text-left transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-lg font-semibold text-slate-800">{r.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
