import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Droplets, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  CreditCard, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  BarChart3,
  ScanLine
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems: SidebarItem[] = [
    { 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="w-5 h-5" />, 
      path: user?.role === 'admin' ? '/admin' : user?.role === 'lector' ? '/lector' : '/dashboard', 
      roles: ['admin', 'lector', 'user'] 
    },
    { 
      label: 'Lecturas', 
      icon: <ClipboardList className="w-5 h-5" />, 
      path: '/admin/lecturas', 
      roles: ['admin'] 
    },
    { 
      label: 'Usuarios', 
      icon: <Users className="w-5 h-5" />, 
      path: '/admin/usuarios', 
      roles: ['admin'] 
    },
    { 
      label: 'Lectores', 
      icon: <ScanLine className="w-5 h-5" />, 
      path: '/admin/lectores', 
      roles: ['admin'] 
    },
    { 
      label: 'Reportes', 
      icon: <BarChart3 className="w-5 h-5" />, 
      path: '/admin/reportes', 
      roles: ['admin'] 
    },
    { 
      label: 'Mis Pagos', 
      icon: <CreditCard className="w-5 h-5" />, 
      path: '/dashboard/pagos', 
      roles: ['user'] 
    },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
      {/* Sidebar - Solo Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">San Pablo</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {filteredMenu.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Droplets className="w-6 h-6 text-primary-500" />
          <span className="text-lg font-bold text-white">San Pablo</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 w-72 h-full shadow-2xl border-r border-slate-700 p-6 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center gap-3 mb-10">
              <Droplets className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-bold text-white">San Pablo</span>
            </div>
            <nav className="flex-1 space-y-2">
              {filteredMenu.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                    location.pathname === item.path 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  <span className="font-semibold text-base">{item.label}</span>
                </button>
              ))}
            </nav>
            <button 
              onClick={handleLogout}
              className="mt-auto flex items-center gap-4 px-4 py-4 text-red-400 font-bold border-t border-slate-700"
            >
              <LogOut className="w-6 h-6" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 bg-slate-900 overflow-y-auto">
        <div className="w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Bar (Solo si es Lector para acceso rápido) */}
      {user?.role === 'lector' && !isMobileMenuOpen && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700 px-6 py-2 flex justify-around items-center z-30">
          {filteredMenu.map((item) => (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 ${location.pathname === item.path ? 'text-primary-500' : 'text-slate-400'}`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;
