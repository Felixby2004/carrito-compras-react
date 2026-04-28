import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, ShoppingBag, Heart, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const isCliente = isAuthenticated && (user?.roles || []).some((r) => r === 'cliente');

  // 👈 NO mostrar el menú en rutas de administración
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Si es ruta de admin, no renderizar nada
  if (isAdminRoute) {
    return null;
  }

  const getDisplayName = () => {
    if (!user) return 'Usuario';
    if (user.email) return user.email.split('@')[0];
    return 'Cliente';
  };

  // Cerrar menú al cambiar de página
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden relative"
        style={{ zIndex: 1000 }}
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay y menú */}
      {isOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 9999,
          display: 'block'
        }} className="lg:hidden">
          
          {/* Fondo oscuro */}
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)'
            }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menú lateral */}
          <div 
            style={{ 
              position: 'fixed', 
              left: 0, 
              top: 0, 
              bottom: 0, 
              width: '280px',
              maxWidth: '85vw',
              backgroundColor: 'white',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              zIndex: 10000,
              padding: '1.5rem',
              overflowY: 'auto'
            }}
          >
            {/* Cabecera */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-blue-600">Menú</h2>
                {isAuthenticated && (
                  <p className="text-sm text-gray-500 mt-1">
                    Hola, {getDisplayName()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Enlaces */}
            <nav className="flex flex-col gap-2">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>🏠</span>
                <span>Inicio</span>
              </Link>
              
              <Link 
                to="/catalogo" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  location.pathname === '/catalogo' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>📦</span>
                <span>Catálogo</span>
              </Link>

              {isCliente && (
                <>
                  <Link
                    to="/mis-ordenes"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      location.pathname === '/mis-ordenes' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Mis Pedidos</span>
                  </Link>
                  
                  <Link
                    to="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      location.pathname === '/wishlist' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                    <span>Lista de Deseados</span>
                  </Link>

                  <Link
                    to="/perfil"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      location.pathname === '/perfil' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Mi Perfil</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Footer - Cerrar sesión */}
            {isAuthenticated && (
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}