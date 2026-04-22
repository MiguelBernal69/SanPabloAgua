import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  CreditCard, 
  Calendar, 
  FileText,
  AlertCircle,
  TrendingUp,
  History
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Reading, Payment } from '../../types/index';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.customer?.id) return;
      try {
        const [readingsRes, paymentsRes] = await Promise.all([
          api.get(`/readings/customer/${user.customer.id}`),
          api.get(`/payments/customer/${user.customer.id}`)
        ]);
        setReadings(readingsRes.data);
        setPayments(paymentsRes.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

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

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Readings History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              Últimas 10 Lecturas
            </h3>
          </div>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-700/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Periodo</th>
                    <th className="px-6 py-4 text-right">Lectura</th>
                    <th className="px-6 py-4 text-right">Consumo</th>
                    <th className="px-6 py-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {readings.slice(0, 10).map(r => (
                    <tr key={r.id} className="text-sm hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 text-slate-300 font-medium">{r.month}/{r.year}</td>
                      <td className="px-6 py-4 text-right text-slate-400 font-mono">{r.current_reading.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right text-white font-bold">{r.consumption.toFixed(1)} m³</td>
                      <td className="px-6 py-4 text-right">
                        {r.is_paid ? (
                          <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md text-[10px] uppercase">Pagado</span>
                        ) : (
                          <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-md text-[10px] uppercase">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {readings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">No hay lecturas registradas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Payments & Last Payment Highlight */}
        <div className="space-y-6">
          {payments.length > 0 && (
            <div className="bg-slate-800 p-6 rounded-3xl border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-4">Confirmación de Último Pago</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-white">Bs. {payments[0].amount.toFixed(2)}</p>
                  <p className="text-slate-400 text-xs mt-1">Pagado el {new Date(payments[0].payment_date).toLocaleDateString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
