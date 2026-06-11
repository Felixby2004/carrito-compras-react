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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-amber-50">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white/90 backdrop-blur-soft shadow-glow p-6 border-r border-white/70">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">{panelTitle}</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-3 rounded-2xl hover:bg-slate-100 transition-all">
                <X className="w-6 h-6 text-slate-700" />
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-semibold ${
                      isActive
                        ? 'bg-gradient-primary text-white shadow-glow scale-105'
                        : 'text-slate-700 hover:bg-slate-100 hover:scale-102'
                    }`
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <Link
                to="/"
                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-emerald-700 hover:bg-emerald-50 transition-all font-semibold hover:scale-102"
              >
                <Store className="w-6 h-6" />
                <span>Ir a la Tienda</span>
              </Link>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-700 hover:bg-rose-50 transition-all font-semibold hover:scale-102"
              >
                <LogOut className="w-6 h-6" />
                <span>Cerrar Sesión</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/85 backdrop-blur-soft shadow-soft border-r border-white/70">
          <div className="flex items-center justify-center h-20 border-b border-white/60">
            <Link to="/admin" className="text-2xl font-black text-slate-800" title={panelTitle}>
              {panelTitle}
            </Link>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-semibold ${
                    isActive
                      ? 'bg-gradient-primary text-white shadow-glow scale-105'
                      : 'text-slate-700 hover:bg-slate-100 hover:scale-102'
                  }`
                }
              >
                <item.icon className="w-6 h-6" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <Link
              to="/"
              className="flex items-center gap-4 px-4 py-4 rounded-2xl text-emerald-700 hover:bg-emerald-50 transition-all font-semibold hover:scale-102"
            >
              <Store className="w-6 h-6" />
              <span>Ir a la Tienda</span>
            </Link>
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-700 hover:bg-rose-50 transition-all font-semibold hover:scale-102"
            >
              <LogOut className="w-6 h-6" />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
          <div className="border-t border-white/60 p-6">
            <p className="text-sm text-slate-600 font-semibold">{user?.email}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{roleLabel}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar mobile */}
        <div className="lg:hidden bg-white/85 backdrop-blur-soft shadow-soft p-4 flex items-center justify-between border-b border-white/70">
          <button onClick={() => setSidebarOpen(true)} className="p-3 rounded-2xl hover:bg-slate-100 transition-all">
            <Menu className="w-7 h-7 text-slate-700" />
          </button>
          <Link to="/admin" className="text-xl font-black text-slate-800">
            {panelTitle}
          </Link>
          <Link to="/" className="p-3 rounded-2xl hover:bg-emerald-50 text-emerald-700 transition-all">
            <Store className="w-6 h-6" />
          </Link>
        </div>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
