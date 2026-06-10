import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { notify } from '../../utils/notify';
import { Upload, Trash2 } from 'lucide-react';

type TemaConfig = {
  colorPrimario: string;
  colorSecundario: string;
  colorAcento: string;
  logoUrl: string | null;
  nombreTienda: string | null;
};

const defaultTema: TemaConfig = {
  colorPrimario: '#2563eb',
  colorSecundario: '#0f172a',
  colorAcento: '#f59e0b',
  logoUrl: null,
  nombreTienda: 'E-Commerce',
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
      const data = { ...defaultTema, ...(res.data?.data || {}) };
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For simplicity, we'll just use a FileReader to convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setTema(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setTema(prev => ({ ...prev, logoUrl: null }));
  };

  useEffect(() => {
    cargar();
  }, []);

  if (loading) return <div className="text-center py-12">Cargando configuración...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Configuración del Sistema</h1>
      <p className="text-sm text-slate-600 mb-6">Personaliza colores, logo y nombre de tu tienda sin tocar código.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-4xl">
        {/* Nombre de la tienda */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Nombre de la Tienda</label>
          <input
            type="text"
            value={tema.nombreTienda || ''}
            onChange={(e) => setTema((prev) => ({ ...prev, nombreTienda: e.target.value }))}
            placeholder="Mi Tienda"
            className="w-full border border-gray-200 rounded-xl p-3 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
          />
        </div>

        {/* Logo */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Logo de la Tienda</label>
          <div className="flex items-center gap-4">
            {tema.logoUrl ? (
              <div className="flex items-center gap-4">
                <img src={tema.logoUrl} alt="Logo" className="h-16 w-auto object-contain bg-gray-50 rounded-lg p-2" />
                <button
                  onClick={removeLogo}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[var(--color-primary)] hover:bg-gray-50 transition-all">
                <Upload className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Subir logo (PNG, JPG, SVG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Colores */}
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-4">Colores del Tema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm">
              <span className="block mb-2 font-medium text-gray-700">Color primario</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={tema.colorPrimario}
                  onChange={(e) => setTema((prev) => ({ ...prev, colorPrimario: e.target.value }))}
                  className="w-16 h-12 rounded-lg cursor-pointer border-0"
                />
                <span className="text-sm text-gray-500 font-mono">{tema.colorPrimario}</span>
              </div>
            </label>
            <label className="text-sm">
              <span className="block mb-2 font-medium text-gray-700">Color secundario</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={tema.colorSecundario}
                  onChange={(e) => setTema((prev) => ({ ...prev, colorSecundario: e.target.value }))}
                  className="w-16 h-12 rounded-lg cursor-pointer border-0"
                />
                <span className="text-sm text-gray-500 font-mono">{tema.colorSecundario}</span>
              </div>
            </label>
            <label className="text-sm">
              <span className="block mb-2 font-medium text-gray-700">Color acento</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={tema.colorAcento}
                  onChange={(e) => setTema((prev) => ({ ...prev, colorAcento: e.target.value }))}
                  className="w-16 h-12 rounded-lg cursor-pointer border-0"
                />
                <span className="text-sm text-gray-500 font-mono">{tema.colorAcento}</span>
              </div>
            </label>
          </div>
        </div>

        {/* Vista previa */}
        <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700 mb-4">Vista previa</p>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {tema.logoUrl ? (
                  <img src={tema.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: tema.colorPrimario }}>
                    {tema.nombreTienda?.charAt(0) || 'E'}
                  </div>
                )}
                <span className="font-bold text-xl" style={{ color: tema.colorPrimario }}>{tema.nombreTienda || 'E-Commerce'}</span>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: tema.colorPrimario }}>Primario</span>
                <span className="px-4 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: tema.colorSecundario }}>Secundario</span>
                <span className="px-4 py-2 rounded-lg text-black font-medium" style={{ backgroundColor: tema.colorAcento }}>Acento</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="w-full h-24 bg-gray-200 rounded-lg mb-3"></div>
                  <p className="text-sm font-medium text-gray-700">Producto {i}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: tema.colorPrimario }}>$99.99</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={guardar}
            disabled={saving}
            className="px-6 py-3 rounded-xl text-white disabled:opacity-50 font-semibold transition-all hover:opacity-90 shadow-lg"
            style={{ backgroundColor: tema.colorPrimario }}
          >
            {saving ? 'Guardando…' : 'Guardar Configuración'}
          </button>
          <button
            onClick={cargar}
            className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold text-gray-700 transition-all"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}

