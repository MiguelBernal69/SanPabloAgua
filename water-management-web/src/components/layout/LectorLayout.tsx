import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Droplets, User, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LectorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">San Pablo</h1>
              <span className="text-[10px] text-primary-400 font-medium uppercase tracking-wider">Lector</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700 px-6 py-3 flex justify-around items-center z-50">
        <button 
          onClick={() => navigate('/lector')}
          className="flex flex-col items-center gap-1 text-primary-500"
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">Buscar</span>
        </button>
        <button 
          onClick={() => navigate('/lector/perfil')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default LectorLayout;
