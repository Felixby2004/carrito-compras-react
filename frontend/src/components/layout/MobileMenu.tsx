import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCliente = isAuthenticated && (user?.roles || []).some((r) => r === 'cliente');

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menú lateral */}
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-blue-600">Menú</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="text-gray-700 hover:text-blue-600 py-2"
              >
                Inicio
              </Link>
              <Link 
                to="/catalogo" 
                onClick={() => setIsOpen(false)}
                className="text-gray-700 hover:text-blue-600 py-2"
              >
                Catálogo
              </Link>
              {isCliente && (
                <>
                  <Link
                    to="/mis-ordenes"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 py-2"
                  >
                    Mis Pedidos
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 py-2"
                  >
                    Lista de Deseados
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}