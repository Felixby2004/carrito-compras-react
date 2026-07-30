import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const hasToken = typeof window !== 'undefined' && !!(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'));
  const roles = user?.roles || [];
  const isAdmin = roles.some((role) => ['administrador', 'admin', 'gerente', 'gerente_ventas', 'gerente_inventario', 'vendedor'].includes(role));
  
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/" replace />;
  }

  if (hasToken && (!user || !user.roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}