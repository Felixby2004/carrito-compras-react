import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import { useCartStore } from './stores/cartStore';
import { HomePage } from './pages/shop/HomePage';
import { CatalogoPage } from './pages/shop/CatalogoPage';
import { MobileMenu } from './components/layout/MobileMenu';
import { CartIcon } from './components/layout/CartIcon';
import { CartDrawer } from './components/layout/CartDrawer';
import { LoginModal } from './components/layout/LoginModal';
import type { Producto } from './types';
import { ProductoDetallePage } from './pages/shop/ProductoDetallePage';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProductosAdminPage } from './pages/admin/ProductosAdminPage';
import { AdminRoute } from './components/admin/AdminRoute';
import { DashboardPage } from './pages/admin/DashboardPage';

// Componente interno que usa useLocation
function AppContent() {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { loadCart } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated, loadCart]);

  const handleLogout = async () => {
    await logout();
    alert('Sesión cerrada');
  };

  const handleAddToCart = async (producto: Producto) => {
    const { addItem } = useCartStore.getState();
    try {
      await addItem(producto.id, 1);
      alert(`✅ Agregado: ${producto.nombre}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al agregar al carrito');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar - solo visible si NO es ruta de admin */}
      {!isAdminRoute && (
        <nav className="bg-white shadow-md sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            {/* Logo y menú móvil */}
            <div className="flex items-center gap-4">
              <MobileMenu />
              <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
                E-Commerce
              </Link>
            </div>

            {/* Links desktop */}
            <div className="hidden lg:flex gap-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600">Inicio</Link>
              <Link to="/catalogo" className="text-gray-700 hover:text-blue-600">Catálogo</Link>
            </div>

            {/* Iconos derecha */}
            <div className="flex items-center gap-3">
              {/* Carrito */}
              <CartIcon onClick={() => setIsCartOpen(true)} />

              {/* Usuario / Login */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                    <User className="w-5 h-5 text-gray-700" />
                    <span className="hidden md:inline text-sm text-gray-700">
                      {user?.email?.split('@')[0]}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <User className="w-5 h-5 text-gray-700" />
                  <span className="hidden md:inline text-sm">Ingresar</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage onAddToCart={handleAddToCart} />} />
        <Route path="/catalogo" element={<CatalogoPage onAddToCart={handleAddToCart} />} />
        <Route path="/producto/:id" element={<ProductoDetallePage />} />
        
        {/* Rutas de administrador - anidadas */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="productos" element={<ProductosAdminPage />} />
          <Route path="ordenes" element={<div>Gestión de órdenes</div>} />
          <Route path="clientes" element={<div>Gestión de clientes</div>} />
          <Route path="cupones" element={<div>Gestión de cupones</div>} />
          <Route path="reportes" element={<div>Reportes</div>} />
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