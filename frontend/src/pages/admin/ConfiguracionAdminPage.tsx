import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { notify } from '../../utils/notify';
import { Upload, Trash2, Sparkles, Settings, Save, RotateCcw } from 'lucide-react';

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
  nombreTienda: 'eMarket Perú',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center animate-slide-up">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
            <Settings className="w-9 h-9 text-indigo-500" />
            Configuración del Sistema
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse-glow" />
          </h1>
          <p className="text-sm text-slate-600 mt-2">Personaliza colores, logo y nombre de tu tienda sin tocar código.</p>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6 max-w-5xl">
        {/* Nombre de la tienda */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Nombre de la Tienda</label>
          <input
            type="text"
            value={tema.nombreTienda || ''}
            onChange={(e) => setTema((prev) => ({ ...prev, nombreTienda: e.target.value }))}
            placeholder="Mi Tienda"
            className="w-full px-4 py-3 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-lg"
          />
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Logo de la Tienda</label>
          <div className="flex items-center gap-4">
            {tema.logoUrl ? (
              <div className="flex items-center gap-4">
                <img src={tema.logoUrl} alt="Logo" className="h-16 w-auto object-contain bg-gradient-to-br from-slate-50 to-white rounded-xl p-2 border border-slate-200" />
                <button
                  onClick={removeLogo}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-100 to-rose-100 hover:from-red-200 hover:to-rose-200 text-red-700 rounded-xl transition-all duration-300 font-semibold hover:scale-105"
                >
                  <Trash2 className="w-5 h-5" />
                  Eliminar
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-gradient-to-br from-indigo-50 to-amber-50 rounded-xl cursor-pointer transition-all duration-300">
                <Upload className="w-6 h-6 text-slate-500 hover:text-indigo-600" />
                <span className="text-slate-600 font-semibold">Subir logo (PNG, JPG, SVG)</span>
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
          <h3 className="text-xl font-semibold text-slate-800 mb-6">Colores del Tema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <label className="text-sm">
              <span className="block mb-3 font-semibold text-slate-700">Color primario</span>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={tema.colorPrimario}
                  onChange={(e) => setTema((prev) => ({ ...prev, colorPrimario: e.target.value }))}
                  className="w-20 h-16 rounded-xl cursor-pointer border-0"
                />
                <span className="text-sm text-slate-500 font-mono">{tema.colorPrimario}</span>
              </div>
            </label>
            <label className="text-sm">
              <span className="block mb-3 font-semibold text-slate-700">Color secundario</span>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={tema.colorSecundario}
                  onChange={(e) => setTema((prev) => ({ ...prev, colorSecundario: e.target.value }))}
                  className="w-20 h-16 rounded-xl cursor-pointer border-0"
                />
                <span className="text-sm text-slate-500 font-mono">{tema.colorSecundario}</span>
              </div>
            </label>
            <label className="text-sm">
              <span className="block mb-3 font-semibold text-slate-700">Color acento</span>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={tema.colorAcento}
                  onChange={(e) => setTema((prev) => ({ ...prev, colorAcento: e.target.value }))}
                  className="w-20 h-16 rounded-xl cursor-pointer border-0"
                />
                <span className="text-sm text-slate-500 font-mono">{tema.colorAcento}</span>
              </div>
            </label>
          </div>
        </div>

        {/* Vista previa */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-slate-50 to-white">
          <p className="text-sm font-semibold text-slate-700 mb-6">Vista previa</p>
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                {tema.logoUrl ? (
                  <img src={tema.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                ) : (
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: tema.colorPrimario }}>
                    {tema.nombreTienda?.charAt(0) || 'e'}
                  </div>
                )}
                <span className="font-bold text-2xl" style={{ color: tema.colorPrimario }}>{tema.nombreTienda || 'eMarket Perú'}</span>
              </div>
              <div className="flex gap-3">
                <span className="px-6 py-3 rounded-xl text-white font-semibold shadow-md" style={{ backgroundColor: tema.colorPrimario }}>Primario</span>
                <span className="px-6 py-3 rounded-xl text-white font-semibold shadow-md" style={{ backgroundColor: tema.colorSecundario }}>Secundario</span>
                <span className="px-6 py-3 rounded-xl text-black font-semibold shadow-md" style={{ backgroundColor: tema.colorAcento }}>Acento</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 text-center border border-slate-100 shadow-sm">
                  <div className="w-full h-24 bg-gradient-to-br from-slate-200 to-slate-100 rounded-lg mb-3"></div>
                  <p className="text-sm font-semibold text-slate-700">Producto {i}</p>
                  <p className="text-sm font-bold mt-2" style={{ color: tema.colorPrimario }}>$99.99</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={guardar}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-white disabled:opacity-50 font-semibold transition-all duration-300 hover:scale-105 shadow-xl"
            style={{ backgroundColor: tema.colorPrimario }}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
          <button
            onClick={cargar}
            className="flex items-center gap-2 px-8 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 transition-all duration-300 hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}
