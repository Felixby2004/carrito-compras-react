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

  // Cerrar menú al cambiar de página
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  console.log('Usuario completo:', user);
  console.log('Propiedades:', user ? Object.keys(user) : 'no user');

  return (
    <>
      {/* Botón hamburguesa - con z-index alto */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden relative z-30"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay - fondo oscuro */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fondo semitransparente - on click cierra */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menú lateral - con animación */}
          <div className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 p-6 animate-slide-in">
            {/* Cabecera del menú */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-blue-600">Menú</h2>
                {isAuthenticated && (
                  <p className="text-sm text-gray-500 mt-1">
                    Hola, {user?.email?.split('@')[0] || 'Usuario'}
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
            
            {/* Enlaces del menú */}
            <nav className="flex flex-col gap-2">
              <Link 
                to="/" 
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

            {/* Footer del menú - Cerrar sesión */}
            {isAuthenticated && (
              <div className="absolute bottom-6 left-6 right-6">
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