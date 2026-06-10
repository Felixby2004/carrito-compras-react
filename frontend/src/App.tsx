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
    logoUrl: null,
    nombreTienda: 'E-Commerce',
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
          logoUrl: null,
          nombreTienda: 'E-Commerce',
          ...data.data
        };
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - solo visible si NO es ruta de admin */}
      {!isAdminRoute && (
        <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            {/* Logo y menú móvil */}
            <div className="flex items-center gap-4">
              {!isAdminRoute && <MobileMenu key="mobile-menu" />}
              <Link
                to="/"
                className="flex items-center gap-3 text-2xl font-bold"
                style={{ color: 'var(--color-primary, #2563eb)' }}
              >
                {tema.logoUrl ? (
                  <img src={tema.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: tema.colorPrimario }}>
                    {tema.nombreTienda?.charAt(0) || 'E'}
                  </div>
                )}
                <span>{tema.nombreTienda || 'E-Commerce'}</span>
              </Link>
            </div>

            {/* Links desktop */}
            <div className="hidden lg:flex gap-8 items-center">
              <Link to="/" className="text-gray-700 hover:text-[var(--color-primary)] transition-colors font-medium">Inicio</Link>
              <Link to="/catalogo" className="text-gray-700 hover:text-[var(--color-primary)] transition-colors font-medium">Catálogo</Link>
              {isCliente && (
                <>
                  <Link to="/mis-ordenes" className="text-gray-700 hover:text-[var(--color-primary)] transition-colors font-medium">Mis Pedidos</Link>
                  <Link to="/wishlist" className="text-gray-700 hover:text-[var(--color-primary)] transition-colors font-medium">Lista de Deseos</Link>
                </>
              )}
            </div>

            {/* Iconos derecha */}
            <div className="flex items-center gap-3">
              {/* Enlace a Admin (solo para administradores) */}
              {isAuthenticated && user?.roles?.some((r) => ['administrador', 'admin', 'gerente', 'gerente_ventas', 'gerente_inventario', 'vendedor'].includes(r)) && (
                <Link 
                  to="/admin" 
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                  title="Panel de Administración"
                >
                  <span className="text-lg">⚙️</span>
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
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-700" />
                    <span className="hidden md:inline text-sm text-gray-700 font-medium">
                      {user?.email?.split('@')[0]}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      {isCliente && (
                        <>
                          <Link
                            to="/mis-ordenes"
                            onClick={() => setUserMenuOpen(false)}
                            className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Mis Pedidos
                          </Link>
                          <Link
                            to="/wishlist"
                            onClick={() => setUserMenuOpen(false)}
                            className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Lista de Deseos
                          </Link>
                          <div className="border-t border-gray-100 my-1"></div>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline">Ingresar</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage onAddToCart={handleAddToCart} isAuthenticated={isAuthenticated} />} />
        <Route path="/catalogo" element={<CatalogoPage onAddToCart={handleAddToCart} />} />
        <Route path="/producto/:id" element={<ProductoDetallePage />} />
        {/* Rutas de cliente solo - bloquear para admins */}
        <Route path="/checkout" element={!isAdmin ? <CheckoutPage /> : <Navigate to="/admin" replace />} />
        <Route path="/mis-ordenes" element={!isAdmin ? <MisOrdenesPage /> : <Navigate to="/admin" replace />} />
        <Route path="/mis-ordenes/:id" element={!isAdmin ? <OrdenDetallePage /> : <Navigate to="/admin" replace />} />
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