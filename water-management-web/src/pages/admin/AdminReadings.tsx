import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Printer, 
  Calendar,
  X,
  CreditCard,
  MapPin,
  User,
  Calculator,
  ArrowRight,
  Clock,
  Banknote,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import type { Reading } from '../../types/index';

const AdminReadings: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter States
  const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReadings = async () => {
    setLoading(true);
    try {
      let url = '/readings';
      if (searchTerm) {
        url += `?search=${searchTerm}`;
      } else if (filterMode === 'month') {
        url += `?month=${filterMonth}&year=${filterYear}`;
      } else if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await api.get(url);
      setReadings(response.data);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [filterMonth, filterYear, filterMode, searchTerm]);

  const handleOpenDetails = async (reading: Reading) => {
    // Intentamos traer la lectura con sus pagos pre-cargados
    try {
      const response = await api.get(`/readings/${reading.id}`);
      setSelectedReading(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      // Si falla, mostramos lo que tenemos
      setSelectedReading(reading);
      setIsDetailModalOpen(true);
    }
  };

  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentReading, setPaymentReading] = useState<Reading | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenPayment = (reading: Reading) => {
    setPaymentReading(reading);
    setPaymentMethod('efectivo');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentReading) return;
    
    setIsProcessing(true);
    try {
      await api.post('/payments', {
        customer_id: paymentReading.customer_id,
        reading_id: paymentReading.id,
        amount: paymentReading.total_amount,
        payment_method: paymentMethod,
        notes: 'Pago en oficina'
      });
      setIsPaymentModalOpen(false);
      setPaymentReading(null);
      fetchReadings();
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredReadings = readings.filter(r => 
    r.customer?.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer?.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lógica de desglose (replica el backend)
  const calculateBreakdown = (consumption: number) => {
    const minConsumption = 10;
    const minCost = 37;
    const tier1Limit = 25;
    const tier1Price = 3;
    const tier2Price = 8;

    let tier1M3 = 0;
    let tier1Cost = 0;
    let tier2M3 = 0;
    let tier2Cost = 0;

    if (consumption > minConsumption) {
      const excess = consumption - minConsumption;
      if (consumption <= tier1Limit) {
        tier1M3 = excess;
        tier1Cost = excess * tier1Price;
      } else {
        tier1M3 = tier1Limit - minConsumption;
        tier1Cost = tier1M3 * tier1Price;
        tier2M3 = consumption - tier1Limit;
        tier2Cost = tier2M3 * tier2Price;
      }
    }

    return { minCost, tier1M3, tier1Cost, tier2M3, tier2Cost };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Lecturas</h1>
          <p className="text-slate-400 text-sm">Control de consumos y cobranzas mensuales</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 transition-all text-sm font-bold">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary-600/20 transition-all text-sm font-bold">
            <Printer className="w-4 h-4" /> Imprimir Recibos
          </button>
        </div>
      </div>

      {/* Debt Summary */}
      {searchTerm && filteredReadings.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in duration-300 shadow-xl shadow-amber-500/5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/40">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Estado de Cuenta Consolidado</h2>
              <p className="text-amber-200/60 text-sm font-medium">Resumen de deuda total para los resultados filtrados</p>
            </div>
          </div>
          <div className="text-center md:text-right space-y-2">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Total Pendiente</p>
            <p className="text-4xl font-black text-white">
              Bs. {filteredReadings
                .filter(r => !r.is_paid)
                .reduce((sum, r) => sum + r.total_amount, 0)
                .toFixed(2)}
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-1.5">
              {Array.from(new Set(
                filteredReadings
                  .filter(r => !r.is_paid)
                  .map(r => new Date(0, r.month - 1).toLocaleString('es', { month: 'short' }).toUpperCase())
              )).map(month => (
                <span key={month} className="px-2 py-1 bg-amber-500/20 text-amber-500 text-[9px] font-black rounded-md border border-amber-500/30">
                  {month}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button onClick={() => setFilterMode('month')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterMode === 'month' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Mes Específico</button>
            <button onClick={() => setFilterMode('range')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterMode === 'range' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Rango de Fechas</button>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input type="text" placeholder="Buscar cliente o código..." className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-700/50">
          {filterMode === 'month' ? (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-500" />
              <div className="flex items-center gap-2">
                <select className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>))}
                </select>
                <select className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <input type="date" className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input type="date" className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <button className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl text-xs font-black transition-all">Aplicar</button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-[2rem] border border-slate-700 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-700/20 text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">
              <tr>
                <th className="px-6 py-6 text-left">Cliente</th>
                <th className="px-4 py-6">Periodo</th>
                <th className="px-4 py-6">L. Anterior</th>
                <th className="px-4 py-6">L. Actual</th>
                <th className="px-4 py-6">Consumo</th>
                <th className="px-4 py-6">Total Bs.</th>
                <th className="px-4 py-6 text-center">Estado</th>
                <th className="px-4 py-6 text-center">Notas</th>
                <th className="px-6 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredReadings.map(r => (
                <tr key={r.id} className="hover:bg-slate-700/10 transition-colors group text-center">
                  <td className="px-6 py-5 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-primary-500 transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{r.customer?.user?.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{r.customer?.customer_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-[10px] font-black text-white bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                      {new Date(0, r.month - 1).toLocaleString('es', { month: 'short' }).toUpperCase()} {r.year}
                    </span>
                  </td>
                  <td className="px-4 py-5 font-mono text-sm text-slate-500">{r.previous_reading.toFixed(1)}</td>
                  <td className="px-4 py-5 font-mono text-sm text-slate-300 font-bold">{r.current_reading.toFixed(1)}</td>
                  <td className="px-4 py-5 text-sm font-black text-primary-400">{r.consumption.toFixed(1)} <span className="text-[10px]">m³</span></td>
                  <td className="px-4 py-5 text-md font-black text-white">Bs. {r.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${r.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {r.is_paid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <p className="text-[10px] text-slate-500 max-w-[120px] truncate mx-auto" title={r.notes}>
                      {r.notes || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!r.is_paid && (
                        <button onClick={() => handleOpenPayment(r)} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-xs font-black transition-all">Cobrar</button>
                      )}
                      <button onClick={() => handleOpenDetails(r)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 custom-scrollbar">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-500 shadow-inner">
                  <Calculator className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Detalle de Consumo</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{selectedReading.customer?.user?.name}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Readings Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Lectura Anterior</p>
                  <p className="text-2xl font-mono text-white">{selectedReading.previous_reading.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-slate-700 hidden md:block" />
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Lectura Actual</p>
                  <p className="text-2xl font-mono text-white">{selectedReading.current_reading.toFixed(2)}</p>
                </div>
              </div>

              {/* Breakdown List */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Desglose de Facturación</h3>
                <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800/50">
                  {/* Básico */}
                  <div className="p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                      <div>
                        <p className="text-sm font-bold text-white">Consumo Básico (0-10 m³)</p>
                        <p className="text-[10px] text-slate-500">Cargo mínimo obligatorio</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-white">Bs. 37.00</p>
                  </div>

                  {/* Tier 1 */}
                  {selectedReading.consumption > 10 && (
                    <div className="p-5 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div>
                          <p className="text-sm font-bold text-white">Excedente Nivel 1 (11-25 m³)</p>
                          <p className="text-[10px] text-slate-500">{calculateBreakdown(selectedReading.consumption).tier1M3.toFixed(1)} m³ extra x Bs. 3.00</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-white">Bs. {calculateBreakdown(selectedReading.consumption).tier1Cost.toFixed(2)}</p>
                    </div>
                  )}

                  {/* Tier 2 */}
                  {selectedReading.consumption > 25 && (
                    <div className="p-5 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div>
                          <p className="text-sm font-bold text-white">Excedente Nivel 2 (26+ m³)</p>
                          <p className="text-[10px] text-slate-500">{calculateBreakdown(selectedReading.consumption).tier2M3.toFixed(1)} m³ extra x Bs. 8.00</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-white">Bs. {calculateBreakdown(selectedReading.consumption).tier2Cost.toFixed(2)}</p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="p-6 bg-slate-900/50 flex justify-between items-end border-t-2 border-primary-500/20">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Volumen Total</p>
                      <p className="text-2xl font-black text-white italic">{selectedReading.consumption.toFixed(1)} <span className="text-sm font-bold text-slate-500 not-italic">m³</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">Monto a Liquidar</p>
                      <p className="text-4xl font-black text-primary-500">Bs. {selectedReading.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedReading.notes && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones del Lector</h3>
                  <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-3xl">
                    <p className="text-sm text-amber-200/80 leading-relaxed italic">
                      "{selectedReading.notes}"
                    </p>
                  </div>
                </div>
              )}

              {/* Status and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Fecha de Medición</p>
                    <p className="text-sm font-bold text-white">{new Date(selectedReading.reading_date).toLocaleString()}</p>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center gap-4 ${selectedReading.is_paid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedReading.is_paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {selectedReading.is_paid ? <CheckCircle2 className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Estado / Fecha Pago</p>
                    <p className={`text-sm font-bold ${selectedReading.is_paid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {selectedReading.is_paid ? `Pagado el ${selectedReading.payments && selectedReading.payments.length > 0 ? new Date(selectedReading.payments[0].payment_date).toLocaleDateString() : 'Oficina'}` : 'Pendiente de Cobro'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payment Modal */}
      {isPaymentModalOpen && paymentReading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/50 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-emerald-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Cobrar Servicio</h2>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Confirmación de Pago</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                disabled={isProcessing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Client Info Summary */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                  <span className="text-slate-500 text-xs font-bold uppercase">Cliente</span>
                  <span className="text-white font-black text-sm">{paymentReading.customer?.user?.name}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                  <span className="text-slate-500 text-xs font-bold uppercase">Periodo</span>
                  <span className="text-white font-bold text-sm uppercase">
                    {new Date(0, paymentReading.month - 1).toLocaleString('es', { month: 'long' })} {paymentReading.year}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 text-xs font-bold uppercase">Total a Cobrar</span>
                  <span className="text-3xl font-black text-emerald-500">Bs. {paymentReading.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${paymentMethod === 'efectivo' ? 'border-primary-500 bg-primary-500/10 text-white shadow-lg shadow-primary-500/10' : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'}`}
                  >
                    <Banknote className="w-4 h-4" /> Efectivo
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${paymentMethod === 'transferencia' ? 'border-primary-500 bg-primary-500/10 text-white shadow-lg shadow-primary-500/10' : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'}`}
                  >
                    <CreditCard className="w-4 h-4" /> Transferencia
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    CONFIRMAR COBRO
                  </>
                )}
              </button>
              
              <p className="text-center text-slate-600 text-[10px] font-medium uppercase tracking-tighter">
                Al confirmar, se generará un recibo oficial en el sistema.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReadings;
