import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Users, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface ReportData {
  total_readings: number;
  total_consumption: number;
  total_billed: number;
  total_paid: number;
  total_pending: number;
  readings_paid: number;
  readings_pending: number;
  average_consumption: number;
}

const AdminReports: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/reports/monthly?month=${month}&year=${year}`);
        setReport(response.data);
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [month, year]);

  if (!report && !loading) return <div className="text-white">Error al cargar reporte</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reportes Financieros</h1>
          <p className="text-slate-400 text-sm">Análisis de recaudación y consumo por periodo</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <select 
            className="bg-transparent border-none text-sm text-white outline-none"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('es', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            className="bg-transparent border-none text-sm text-white outline-none"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Facturado</p>
          </div>
          <p className="text-2xl font-black text-white">Bs. {report?.total_billed.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 border-b-emerald-500/50 border-b-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Recaudado</p>
          </div>
          <p className="text-2xl font-black text-white">Bs. {report?.total_paid.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 border-b-amber-500/50 border-b-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pendiente</p>
          </div>
          <p className="text-2xl font-black text-white">Bs. {report?.total_pending.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Promedio Consumo</p>
          </div>
          <p className="text-2xl font-black text-white">{report?.average_consumption.toFixed(1)} m³</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            Estado de Lecturas
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Lecturas Pagadas ({report?.readings_paid})</span>
                <span className="text-emerald-500 font-bold">
                  {report && report.total_readings > 0 ? ((report.readings_paid / report.total_readings) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${report && report.total_readings > 0 ? (report.readings_paid / report.total_readings) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Lecturas Pendientes ({report?.readings_pending})</span>
                <span className="text-amber-500 font-bold">
                  {report && report.total_readings > 0 ? ((report.readings_pending / report.total_readings) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${report && report.total_readings > 0 ? (report.readings_pending / report.total_readings) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Resumen Mensual</h3>
              <p className="text-slate-400 text-sm">Periodo {month}/{year}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-700/50 text-sm">
              <span className="text-slate-400">Consumo Total de Agua</span>
              <span className="text-white font-bold">{report?.total_consumption.toFixed(1)} m³</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700/50 text-sm">
              <span className="text-slate-400">Total de Lecturas Realizadas</span>
              <span className="text-white font-bold">{report?.total_readings}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-slate-400 font-bold">Saldo Pendiente por Cobrar</span>
              <span className="text-red-400 font-black">Bs. {report?.total_pending.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
