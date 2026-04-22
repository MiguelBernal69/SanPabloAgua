import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, CheckCircle2, AlertTriangle, Eye, Printer } from 'lucide-react';
import api from '../../services/api';
import type { Reading } from '../../types/index';

const AdminReadings: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/readings?month=${filterMonth}&year=${filterYear}`);
      setReadings(response.data);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [filterMonth, filterYear]);

  const handleMarkAsPaid = async (reading: Reading) => {
    if (!window.confirm(`¿Confirmar pago de Bs. ${reading.total_amount.toFixed(2)}?`)) return;
    try {
      await api.post('/payments', {
        customer_id: reading.customer_id,
        reading_id: reading.id,
        amount: reading.total_amount,
        payment_method: 'efectivo',
        notes: 'Pago en oficina'
      });
      fetchReadings();
    } catch (error) {
      alert('Error al procesar el pago');
    }
  };

  const filteredReadings = readings.filter(r => 
    r.customer?.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer?.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Lecturas</h1>
          <p className="text-slate-400 text-sm">Monitoreo y cobro de consumos mensuales</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 transition-all text-sm font-bold">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-primary-600/20 transition-all text-sm font-bold">
            <Printer className="w-4 h-4" /> Imprimir Avisos
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..." 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-primary-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('es', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-primary-500"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-700/30 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Consumo (m³)</th>
                <th className="px-6 py-4">Monto Total</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha Lectura</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredReadings.map(r => (
                <tr key={r.id} className="hover:bg-slate-700/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{r.customer?.user?.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{r.customer?.customer_code}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                    {r.consumption.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-white">
                    Bs. {r.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {r.is_paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">
                        <AlertTriangle className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(r.reading_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 text-slate-500 hover:text-white transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {!r.is_paid && (
                      <button 
                        onClick={() => handleMarkAsPaid(r)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        Cobrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredReadings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-medium">
                    No se encontraron lecturas para este periodo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReadings;
