import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  CreditCard, 
  Calendar, 
  FileText,
  AlertCircle,
  TrendingUp,
  History,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Reading, Payment } from '../../types/index';

const getMonthAbbreviation = (month: number) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months[month - 1] || '';
};

const UserDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Si no tenemos datos de cliente, intentar refrescar el perfil del usuario
        let currentUser = user;
        if (!currentUser?.customer?.id) {
          const userRes = await api.get('/users/me');
          currentUser = userRes.data;
        }

        if (currentUser?.customer?.id) {
          // Cargar lecturas y pagos de forma independiente para evitar bloqueos
          api.get(`/readings/customer/${currentUser.customer.id}`)
            .then(res => setReadings(res.data))
            .catch(err => console.error('Error fetching readings:', err));

          api.get(`/payments/customer/${currentUser.customer.id}`)
            .then(res => setPayments(res.data))
            .catch(err => console.error('Error fetching payments:', err));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchUserData();
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="font-bold animate-pulse">Cargando tu información...</p>
      </div>
    );
  }

  const unpaidReadings = readings.filter(r => !r.is_paid);
  const totalDebt = unpaidReadings.reduce((acc, r) => acc + r.total_amount, 0);
  const lastConsumption = readings.length > 0 ? readings[0].consumption : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome & Debt Highlight */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white shadow-xl shadow-primary-600/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">¡Hola, {user?.name}! 👋</h1>
            <p className="text-primary-100 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Código de Cliente: <span className="font-bold">{user?.customer?.customer_code}</span>
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 min-w-[200px]">
            <p className="text-primary-100 text-xs font-bold uppercase tracking-wider mb-1">Deuda Total</p>
            <p className="text-3xl font-black text-white">Bs. {totalDebt.toFixed(2)}</p>
            {totalDebt > 0 && (
              <div className="mt-2 flex items-center gap-1 text-amber-300 text-xs font-bold">
                <AlertCircle className="w-3 h-3" /> Pendiente de pago
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Months Row - Full Width */}
      {unpaidReadings.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm min-w-max">
            <AlertCircle className="w-5 h-5 animate-pulse" />
            MESES PENDIENTES DE PAGO:
          </div>
          <div className="flex flex-wrap gap-2">
            {unpaidReadings.map(r => (
              <span key={r.id} className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-rose-500/20">
                {getMonthAbbreviation(r.month)} {r.year}
              </span>
            ))}
          </div>
          <div className="md:ml-auto text-rose-400/70 text-xs italic">
            Por favor, apersónese por las oficinas para regularizar su cuenta.
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consumption Card */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Último Consumo
            </h2>
            <TrendingUp className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-5xl font-black text-white">{lastConsumption.toFixed(1)}</span>
            <span className="text-xl font-bold text-slate-500 mb-1">m³</span>
          </div>
          <p className="text-slate-400 text-sm">
            Registrado en el periodo {readings[0]?.month}/{readings[0]?.year}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-sm flex flex-col justify-center">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Información del Servicio
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Dirección</span>
              <span className="text-slate-200 font-medium">{user?.customer?.address}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Estado</span>
              <span className="text-emerald-500 font-bold">Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Readings History - Full Width */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Historial de Lecturas (Últimas 10)
          </h3>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 bg-slate-900/30">
                  <th className="px-6 py-4">Periodo</th>
                  <th className="px-6 py-4">Lectura Anterior</th>
                  <th className="px-6 py-4">Lectura Actual</th>
                  <th className="px-6 py-4">Consumo Mensual</th>
                  <th className="px-6 py-4">Monto Total</th>
                  <th className="px-6 py-4">Estado de Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {readings.slice(0, 10).map((reading) => (
                  <tr key={reading.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 uppercase tracking-tight">
                          {getMonthAbbreviation(reading.month)} {reading.year}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(reading.reading_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-300 font-mono">
                      {reading.previous_reading.toFixed(1)} <span className="text-xs text-slate-500">m³</span>
                    </td>
                    <td className="px-6 py-5 text-slate-300 font-mono">
                      {reading.current_reading.toFixed(1)} <span className="text-xs text-slate-500">m³</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 font-black text-sm border border-primary-500/20">
                        {reading.consumption.toFixed(1)} m³
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-100 font-black text-lg">
                      {reading.total_amount.toFixed(2)} <span className="text-xs font-normal text-slate-400 ml-1">Bs</span>
                    </td>
                    <td className="px-6 py-5">
                      {reading.is_paid ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20 shadow-lg shadow-rose-500/10">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {readings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      No hay lecturas registradas en el historial.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
