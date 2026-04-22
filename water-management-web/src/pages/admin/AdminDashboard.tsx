import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Droplets, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import api from '../../services/api';
import type { Reading } from '../../types/index';

const AdminDashboard: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const response = await api.get('/readings');
        setReadings(response.data);
      } catch (error) {
        console.error('Error fetching readings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReadings();
  }, []);

  const handleMarkAsPaid = async (reading: Reading) => {
    if (!window.confirm(`¿Confirmar pago de Bs. ${reading.total_amount.toFixed(2)} para ${reading.customer?.user?.name}?`)) return;

    try {
      await api.post('/payments', {
        customer_id: reading.customer_id,
        reading_id: reading.id,
        amount: reading.total_amount,
        payment_method: 'efectivo',
        notes: 'Pago registrado desde panel admin'
      });
      
      // Actualizar lista local
      setReadings(readings.map(r => r.id === reading.id ? { ...r, is_paid: true } : r));
    } catch (error) {
      alert('Error al registrar el pago');
    }
  };

  const pendingPayments = readings.filter(r => !r.is_paid);
  const totalDebt = pendingPayments.reduce((acc, r) => acc + r.total_amount, 0);

  const stats = [
    { label: 'Total Clientes', value: '124', icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
    { label: 'Lecturas este Mes', value: readings.length.toString(), icon: <Droplets className="w-6 h-6" />, color: 'bg-cyan-500' },
    { label: 'Pendiente de Cobro', value: `Bs. ${totalDebt.toFixed(2)}`, icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-amber-500' },
    { label: 'Recaudación Total', value: 'Bs. 4,250.00', icon: <TrendingUp className="w-6 h-6" />, color: 'bg-emerald-500' },
  ];

  const filteredReadings = readings.filter(r => 
    r.customer?.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer?.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
        <p className="text-slate-400 text-sm">Resumen general y gestión del sistema de agua</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-4">
            <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Readings / Payments List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Últimas Lecturas</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Periodo</th>
                    <th className="px-6 py-4">Consumo</th>
                    <th className="px-6 py-4">Monto</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredReadings.map((reading) => (
                    <tr key={reading.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{reading.customer?.user?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{reading.customer?.customer_code}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {reading.month}/{reading.year}
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-mono">
                        {reading.consumption.toFixed(1)} m³
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">
                        Bs. {reading.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {reading.is_paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">
                            <AlertTriangle className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!reading.is_paid && (
                          <button 
                            onClick={() => handleMarkAsPaid(reading)}
                            className="text-primary-400 hover:text-primary-300 text-xs font-bold flex items-center gap-1 ml-auto"
                          >
                            Cobrar <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Actions / Info */}
        <div className="space-y-6">
          <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-xl shadow-primary-600/20">
            <h3 className="text-xl font-bold mb-2 text-white">Cobro Rápido</h3>
            <p className="text-primary-100 text-sm mb-6 leading-relaxed">Escanea el código del cliente o búscalo directamente para registrar un pago.</p>
            <button className="w-full bg-white text-primary-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-50 transition-all">
              <CreditCard className="w-5 h-5" />
              Ingresar Pago
            </button>
          </div>

          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Avisos del Sistema</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                <p className="text-sm text-slate-400">Hay 12 clientes que no han tenido lectura este mes.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                <p className="text-sm text-slate-400">El reporte mensual de marzo ya está disponible.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
