import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Phone, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { phone, password });
      login(response.data);
      
      const role = response.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'lector') navigate('/lector');
      else navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas. Intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 overflow-hidden">
        <img 
          src="/water_splash_abstract_bg_1776884945109.png" 
          alt="Water Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        
        <div className="relative z-10 p-16 flex flex-col justify-end h-full max-w-2xl">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-8 self-start">
            <Droplets className="w-5 h-5 text-primary-400" />
            <span className="text-white font-semibold tracking-wider text-xs uppercase">San Pablo Gestión de Agua</span>
          </div>
          <h2 className="text-5xl font-black text-white leading-tight mb-6">
            Cuidamos cada gota para el <span className="text-primary-400">futuro</span> de nuestra comunidad.
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-12">
            Accede al sistema para gestionar lecturas, revisar deudas y asegurar un servicio de calidad para todos los vecinos.
          </p>
          <div className="flex items-center gap-8 border-t border-white/10 pt-8">
            <div>
              <p className="text-white font-black text-2xl">24/7</p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Soporte Técnico</p>
            </div>
            <div>
              <p className="text-white font-black text-2xl">100%</p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Seguro</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 relative bg-slate-950">
        {/* Background blobs for aesthetics */}
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary-900/10 rounded-full blur-3xl" />

        <div className="max-w-md w-full relative z-10">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary-600 shadow-xl shadow-primary-600/30 mb-4">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">San Pablo Agua</h1>
            <p className="text-slate-500 mt-2">Ingresa a tu cuenta para continuar</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            {/* Form decorative element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary-600/20 transition-all duration-700" />
            
            <div className="mb-10 hidden lg:block">
              <h1 className="text-4xl font-black text-white mb-2">Bienvenido</h1>
              <p className="text-slate-500 font-medium">Por favor ingresa tus credenciales</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Número de Teléfono</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-500 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-14 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all font-medium"
                    placeholder="77777777"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña de Acceso</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-14 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              &copy; 2026 San Pablo · Sistema de Gestión
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
