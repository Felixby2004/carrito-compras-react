import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import { useCartStore } from './stores/cartStore';
import { useWishlistStore } from './stores/wishlistStore';
import { HomePage } from './pages/shop/HomePage';
import { CatalogoPage } from './pages/shop/CatalogoPage';
import { MobileMenu } from './components/layout/MobileMenu';
import { CartIcon } from './components/layout/CartIcon';
import { CartDrawer } from './components/layout/CartDrawer';
import { LoginModal } from './components/layout/LoginModal';
import type { Producto } from './types';
import { ProductoDetallePage } from './pages/shop/ProductoDetallePage';
import { WishlistPage } from './pages/shop/WishlistPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProductosAdminPage } from './pages/admin/ProductosAdminPage';
import { AdminRoute } from './components/admin/AdminRoute';
import { DashboardPage } from './pages/admin/DashboardPage';
import { connectSocket, disconnectSocket } from './socket';
import { CheckoutPage } from './pages/shop/CheckoutPage';
import { MisOrdenesPage } from './pages/shop/MisOrdenesPage';
import { OrdenDetallePage } from './pages/shop/OrdenDetallePage';
import { OrdenesAdminPage } from './pages/admin/OrdenesAdminPage';
import { ClientesAdminPage } from './pages/admin/ClientesAdminPage';
import { InventarioAdminPage } from './pages/admin/InventarioAdminPage';
import { CuponesAdminPage } from './pages/admin/CuponesAdminPage';
import { ReportesAdminPage } from './pages/admin/ReportesAdminPage';
import { ConfiguracionAdminPage } from './pages/admin/ConfiguracionAdminPage';
import { notify } from './utils/notify';
import ErrorBoundary from './components/ErrorBoundary';

type TemaConfig = {
  colorPrimario: string;
  colorSecundario: string;
  colorAcento: string;
  logoUrl: string | null;
  nombreTienda: string;
};

// Componente interno que usa useLocation
function AppContent() {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { loadCart } = useCartStore();
  const { loadWishlist } = useWishlistStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [tema, setTema] = useState<TemaConfig>({
    colorPrimario: '#2563eb',
    colorSecundario: '#0f172a',
    colorAcento: '#f59e0b',
    logoUrl: '/logo.png',
    nombreTienda: 'NexTouch LLC',
  });
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCliente = isAuthenticated && (user?.roles || []).some((r) => r === 'cliente');
  const isAdmin = isAuthenticated && (user?.roles || []).some((r) => ['administrador', 'admin', 'gerente', 'gerente_ventas', 'gerente_inventario', 'vendedor'].includes(r));

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
      loadWishlist();
    }
  }, [isAuthenticated, loadCart, loadWishlist]);

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const el = userMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>;
      const toast = { id: Date.now(), message: e.detail.message, type: e.detail.type };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 3500);
    };
    window.addEventListener('app-notify', handler);
    return () => window.removeEventListener('app-notify', handler);
  }, []);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_URL}/configuracion/publica/tema`);
        const data = await res.json();
        if (!res.ok || !data?.success) return;
        const loadedTema = {
          colorPrimario: '#2563eb',
          colorSecundario: '#0f172a',
          colorAcento: '#f59e0b',
          logoUrl: '/logo.png',
          nombreTienda: 'NexTouch LLC',
          ...data.data
        };
        if (loadedTema.nombreTienda === 'E-Commerce' || loadedTema.nombreTienda === 'eMarket Perú') {
          loadedTema.nombreTienda = 'NexTouch LLC';
        }
        if (!loadedTema.logoUrl || loadedTema.logoUrl.includes('norte') || loadedTema.logoUrl.includes('emarket')) {
          loadedTema.logoUrl = '/logo.png';
        }
        setTema(loadedTema);
        document.documentElement.style.setProperty('--color-primary', loadedTema.colorPrimario);
        document.documentElement.style.setProperty('--color-secondary', loadedTema.colorSecundario);
        document.documentElement.style.setProperty('--color-accent', loadedTema.colorAcento);
      } catch {
        // best effort
      }
    };
    loadTheme();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    notify('Sesion cerrada', 'info');
    setTimeout(() => window.location.href = '/', 500);
  };

  const handleAddToCart = async (producto: Producto) => {
    const { addItem } = useCartStore.getState();
    try {
      await addItem(producto.id, 1);
      notify(`Agregado: ${producto.nombre}`, 'success');
    } catch (error: any) {
      notify(error.response?.data?.message || 'Error al agregar al carrito', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar - solo visible si NO es ruta de admin */}
      {!isAdminRoute && (
        <nav className="bg-white/80 backdrop-blur-soft shadow-soft sticky top-0 z-40 border-b border-white/50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            {/* Logo y menú móvil */}
            <div className="flex items-center gap-4">
              {!isAdminRoute && <MobileMenu key="mobile-menu" />}
              <Link
                to="/"
                className="flex items-center gap-3 text-2xl font-black"
              >
                {tema.logoUrl ? (
                  <img src={tema.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center text-white font-black text-xl">
                    {tema.nombreTienda?.charAt(0) || 'N'}
                  </div>
                )}
                <span className="text-slate-800">{tema.nombreTienda || 'NexTouch LLC'}</span>
              </Link>
            </div>

            {/* Links desktop */}
            <div className="hidden lg:flex gap-8 items-center">
              <Link to="/" className="text-slate-700 hover:text-indigo-600 transition-colors font-semibold text-lg">Inicio</Link>
              <Link to="/catalogo" className="text-slate-700 hover:text-indigo-600 transition-colors font-semibold text-lg">Catálogo</Link>
              {isCliente && (
                <>
                  <Link to="/mis-ordenes" className="text-slate-700 hover:text-indigo-600 transition-colors font-semibold text-lg">Mis Pedidos</Link>
                  <Link to="/wishlist" className="text-slate-700 hover:text-indigo-600 transition-colors font-semibold text-lg">Lista de Deseos</Link>
                </>
              )}
            </div>

            {/* Iconos derecha */}
            <div className="flex items-center gap-4">
              {/* Enlace a Admin (solo para administradores) */}
              {isAuthenticated && user?.roles?.some((r) => ['administrador', 'admin', 'gerente', 'gerente_ventas', 'gerente_inventario', 'vendedor'].includes(r)) && (
                <Link 
                  to="/admin" 
                  className="p-3 rounded-2xl hover:bg-slate-100 text-slate-700 transition-all hover:scale-105 shadow-soft"
                  title="Panel de Administración"
                >
                  <span className="text-xl">⚙️</span>
                </Link>
              )}
              
              {/* Carrito (solo para clientes/no admins) */}
              {!isAdmin && <CartIcon onClick={() => setIsCartOpen(true)} />}

              {/* Usuario / Login */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 transition-all hover:scale-105 shadow-soft"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-glow">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:inline text-slate-700 font-semibold">
                      {user?.email?.split('@')[0]}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-soft rounded-2xl shadow-glow border border-white/60 py-3 z-50 animate-scale-in">
                      {isCliente && (
                        <>
                          <Link
                            to="/mis-ordenes"
                            onClick={() => setUserMenuOpen(false)}
                            className="block w-full text-left px-6 py-3 text-slate-700 hover:bg-slate-100 transition-colors font-semibold rounded-xl mx-2 mb-1"
                          >
                            Mis Pedidos
                          </Link>
                          <Link
                            to="/wishlist"
                            onClick={() => setUserMenuOpen(false)}
                            className="block w-full text-left px-6 py-3 text-slate-700 hover:bg-slate-100 transition-colors font-semibold rounded-xl mx-2 mb-1"
                          >
                            Lista de Deseos
                          </Link>
                          <div className="border-t border-slate-200 my-2 mx-4"></div>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-6 py-3 text-red-600 hover:bg-red-50 transition-colors font-bold rounded-xl mx-2"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-105 transition-all"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline">Ingresar</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<HomePage onAddToCart={handleAddToCart} isAuthenticated={isAuthenticated} />} />
          <Route path="/catalogo" element={<CatalogoPage onAddToCart={handleAddToCart} />} />
          <Route path="/producto/:id" element={<ProductoDetallePage />} />
          {/* Rutas de cliente solo - bloquear para admins */}
          <Route path="/checkout" element={
            !isAdmin ? (
              <ErrorBoundary>
                <CheckoutPage />
              </ErrorBoundary>
            ) : <Navigate to="/admin" replace />
          } />
          <Route path="/mis-ordenes" element={
            !isAdmin ? (
              <ErrorBoundary>
                <MisOrdenesPage />
              </ErrorBoundary>
            ) : <Navigate to="/admin" replace />
          } />
          <Route path="/mis-ordenes/:id" element={
            !isAdmin ? (
              <ErrorBoundary>
                <OrdenDetallePage />
              </ErrorBoundary>
            ) : <Navigate to="/admin" replace />
          } />
          <Route path="/wishlist" element={!isAdmin ? <WishlistPage /> : <Navigate to="/admin" replace />} />
          
          {/* Rutas de administrador - anidadas */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="productos" element={<ProductosAdminPage />} />
            <Route path="ordenes" element={<OrdenesAdminPage />} />
            <Route path="clientes" element={<ClientesAdminPage />} />
            <Route path="inventario" element={<InventarioAdminPage />} />
            <Route path="cupones" element={<CuponesAdminPage />} />
            <Route path="reportes" element={<ReportesAdminPage />} />
            <Route path="configuracion" element={<ConfiguracionAdminPage />} />
          </Route>
          
          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Drawers y Modales - solo visibles fuera de admin */}
        {!isAdminRoute && (
          <>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
          </>
        )}
        
        {/* Toasts */}
        <div className="fixed bottom-4 right-4 z-[100] space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-5 py-3 rounded-xl shadow-lg text-sm text-white font-medium transition-all ${
                toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-slate-700'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className={`bg-slate-900 text-slate-200 py-10 ${isAdminRoute ? 'lg:pl-72' : ''}`}>
        <div className="container mx-auto px-4 grid gap-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/logo.png" alt="NexTouch LLC" className="h-10 w-auto object-contain brightness-110" />
              <h2 className="text-xl font-bold text-white">NexTouch LLC</h2>
            </div>
            <p className="mt-2 text-sm text-slate-400 max-w-sm">
              Tu tienda NexTouch LLC con envíos rápidos, ofertas exclusivas y atención dedicada.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Enlaces</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-white">Inicio</Link></li>
              <li><Link to="/catalogo" className="hover:text-white">Catálogo</Link></li>
              <li><Link to="/mis-ordenes" className="hover:text-white">Mis Pedidos</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Contacto</h3>
            <p className="mt-3 text-sm text-slate-400">contacto@nextouch.com</p>
            <p className="mt-1 text-sm text-slate-400">NexTouch LLC</p>
            <p className="mt-3 text-xs text-slate-500">© {new Date().getFullYear()} NexTouch LLC. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente principal
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;