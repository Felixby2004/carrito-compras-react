import apiClient from '../../api/client';
import { notify } from '../../utils/notify';

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
    } catch (error) {
      notify('No se pudo generar el reporte. Verifica tu sesion o permisos.', 'error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de Reportes</h1>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-3">Reportes Operacionales</h2>
          <div className="space-y-2">
            {reportesOperacionales.map((r) => (
              <button key={r.key} onClick={() => abrir('operacional', r.key)} className="w-full text-left border rounded p-2 hover:bg-gray-50">
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
