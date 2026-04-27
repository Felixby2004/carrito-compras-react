import { Outlet, NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Tag,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Store
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const roles = user?.roles || [];
  const hasRole = (r: string) => roles.includes(r);
  const isAdmin = hasRole('administrador') || hasRole('admin');
  const isVentas = hasRole('gerente_ventas') || hasRole('gerente') || hasRole('ventas');
  const isInventario = hasRole('gerente_inventario') || hasRole('inventory_manager');
  const isVendedor = hasRole('vendedor');

  const roleLabel = isAdmin
    ? 'Administrador'
    : isVentas
      ? 'Gerente de Ventas'
      : isInventario
        ? 'Gerente de Inventario'
        : isVendedor
          ? 'Vendedor'
          : 'Usuario';
  const panelTitle = `${roleLabel} - Panel`;

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    ...(isAdmin || isInventario || isVendedor ? [{ to: '/admin/productos', icon: Package, label: 'Productos' }] : []),
    ...(isAdmin || isVentas || isVendedor ? [{ to: '/admin/ordenes', icon: ShoppingBag, label: 'Pedidos' }] : []),
    ...(isAdmin || isVentas || isVendedor ? [{ to: '/admin/clientes', icon: Users, label: 'Clientes' }] : []),
    ...(isAdmin || isInventario ? [{ to: '/admin/inventario', icon: Package, label: 'Inventario' }] : []),
    ...(isAdmin || isVentas ? [{ to: '/admin/cupones', icon: Tag, label: 'Cupones' }] : []),
    ...(isAdmin || isVentas || isInventario ? [{ to: '/admin/reportes', icon: FileText, label: 'Reportes' }] : []),
    ...(isAdmin ? [{ to: '/admin/configuracion', icon: Settings, label: 'Configuración' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white/95 backdrop-blur shadow-xl p-4 border-r border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary, #2563eb)' }}>{panelTitle}</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 hover:bg-green-50 transition"
              >
                <Store className="w-5 h-5" />
                <span>Ir a la Tienda</span>
              </Link>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur shadow-lg border-r border-slate-200">
          <div className="flex items-center justify-center h-16 border-b">
            <Link to="/admin" className="text-xl font-bold" style={{ color: 'var(--color-primary, #2563eb)' }} title={panelTitle}>
              {panelTitle}
            </Link>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 hover:bg-green-50 transition"
            >
              <Store className="w-5 h-5" />
              <span>Ir a la Tienda</span>
            </Link>
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
          <div className="border-t p-4">
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar mobile */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/admin" className="text-xl font-bold" style={{ color: 'var(--color-primary, #2563eb)' }}>
            {panelTitle}
          </Link>
          <Link to="/" className="text-green-600">
            <Store className="w-5 h-5" />
          </Link>
        </div>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}