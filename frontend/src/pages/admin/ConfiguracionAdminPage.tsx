import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { notify } from '../../utils/notify';

type TemaConfig = {
  colorPrimario: string;
  colorSecundario: string;
  colorAcento: string;
};

const defaultTema: TemaConfig = {
  colorPrimario: '#2563eb',
  colorSecundario: '#0f172a',
  colorAcento: '#f59e0b',
};

export function ConfiguracionAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tema, setTema] = useState<TemaConfig>(defaultTema);

  const applyTheme = (cfg: TemaConfig) => {
    document.documentElement.style.setProperty('--color-primary', cfg.colorPrimario);
    document.documentElement.style.setProperty('--color-secondary', cfg.colorSecundario);
    document.documentElement.style.setProperty('--color-accent', cfg.colorAcento);
  };

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/configuracion/tema');
      const data = res.data?.data || defaultTema;
      setTema(data);
      applyTheme(data);
    } catch {
      notify('No se pudo cargar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await apiClient.put('/configuracion/tema', tema);
      applyTheme(tema);
      notify('Configuración guardada', 'success');
    } catch (error: any) {
      notify(error.response?.data?.message || 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (loading) return <div className="text-center py-12">Cargando configuración...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Configuración del Sistema</h1>
      <p className="text-sm text-slate-600 mb-6">Personaliza colores globales del sistema sin tocar código.</p>

      <div className="bg-white rounded-lg shadow p-6 space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm">
            <span className="block mb-1 font-medium">Color primario</span>
            <input
              type="color"
              value={tema.colorPrimario}
              onChange={(e) => setTema((prev) => ({ ...prev, colorPrimario: e.target.value }))}
              className="w-full h-10 border rounded"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 font-medium">Color secundario</span>
            <input
              type="color"
              value={tema.colorSecundario}
              onChange={(e) => setTema((prev) => ({ ...prev, colorSecundario: e.target.value }))}
              className="w-full h-10 border rounded"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 font-medium">Color acento</span>
            <input
              type="color"
              value={tema.colorAcento}
              onChange={(e) => setTema((prev) => ({ ...prev, colorAcento: e.target.value }))}
              className="w-full h-10 border rounded"
            />
          </label>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium mb-3">Vista previa</p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-2 rounded text-white" style={{ backgroundColor: tema.colorPrimario }}>Primario</span>
            <span className="px-3 py-2 rounded text-white" style={{ backgroundColor: tema.colorSecundario }}>Secundario</span>
            <span className="px-3 py-2 rounded text-black" style={{ backgroundColor: tema.colorAcento }}>Acento</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={guardar}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: tema.colorPrimario }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={cargar}
            className="px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}

