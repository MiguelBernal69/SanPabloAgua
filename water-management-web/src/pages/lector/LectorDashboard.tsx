import React, { useState, useEffect } from 'react';
import { Search, User, MapPin, Calculator, Send, CheckCircle2, X } from 'lucide-react';
import api from '../../services/api';
import type { Customer, User as UserType, Reading } from '../../types/index';

interface CustomerWithUser extends Customer {
  user: UserType;
}

const LectorDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<CustomerWithUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithUser | null>(null);
  const [lastReading, setLastReading] = useState<Reading | null>(null);
  const [currentReadingValue, setCurrentReadingValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Cargar clientes al iniciar
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers');
        setCustomers(response.data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCustomer = async (customer: CustomerWithUser) => {
    setSelectedCustomer(customer);
    setError('');
    setSuccess(false);
    setCurrentReadingValue('');
    
    // Buscar última lectura para este cliente
    try {
      const response = await api.get(`/readings/customer/${customer.id}`);
      const readings = response.data;
      if (readings && readings.length > 0) {
        // Asumimos que vienen ordenadas por fecha desc o tomamos la primera
        setLastReading(readings[0]);
      } else {
        setLastReading(null);
      }
    } catch (err) {
      console.error('Error fetching last reading:', err);
      setLastReading(null);
    }
  };

  const consumption = currentReadingValue 
    ? Math.max(0, parseFloat(currentReadingValue) - (lastReading?.current_reading || 0))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    setError('');

    try {
      const now = new Date();
      await api.post('/readings', {
        customer_id: selectedCustomer.id,
        current_reading: parseFloat(currentReadingValue),
        month: now.getMonth() + 1, // JS months are 0-11
        year: now.getFullYear(),
        notes: `Lectura realizada por lector móvil`
      });
      setSuccess(true);
      setTimeout(() => {
        setSelectedCustomer(null);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la lectura');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Search Header */}
      {!selectedCustomer && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text"
                placeholder="Buscar cliente o código..."
                className="w-full bg-slate-900 border-none rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Clientes Encontrados</h2>
            <div className="grid gap-3">
              {filteredCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center justify-between group active:scale-95 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-primary-500">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{customer.user.name}</h3>
                      <p className="text-slate-400 text-xs">{customer.customer_code} • {customer.address}</p>
                    </div>
                  </div>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-500">No se encontraron clientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reading Modal-like View */}
      {selectedCustomer && (
        <div className="animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Header */}
            <div className="p-6 bg-slate-700/50 border-b border-slate-600 flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-primary-400 text-[10px] font-bold uppercase tracking-widest">Registrar Lectura</span>
                <h2 className="text-xl font-bold text-white">{selectedCustomer.user.name}</h2>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  {selectedCustomer.address}
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-2 bg-slate-800 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {success ? (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">¡Lectura Registrada!</h3>
                    <p className="text-slate-400 text-sm">Los datos se han guardado correctamente</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Reading Display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                      <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Anterior</p>
                      <p className="text-2xl font-mono text-white">{lastReading?.current_reading || '0.00'}</p>
                    </div>
                    <div className="bg-primary-500/10 p-4 rounded-2xl border border-primary-500/20">
                      <p className="text-primary-500 text-[10px] font-bold uppercase mb-1">Consumo</p>
                      <p className="text-2xl font-mono text-primary-500">{consumption.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="space-y-3">
                    <label className="text-slate-300 text-sm font-medium px-1">Lectura Actual (m³)</label>
                    <div className="relative">
                      <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
                      <input 
                        type="number"
                        step="0.01"
                        autoFocus
                        required
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl pl-14 pr-4 py-5 text-3xl font-mono text-white focus:border-primary-500 focus:ring-0 transition-all"
                        placeholder="0.00"
                        value={currentReadingValue}
                        onChange={(e) => setCurrentReadingValue(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting || !currentReadingValue}
                    className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-600/20 transition-all active:scale-[0.98]"
                  >
                    <Send className="w-5 h-5" />
                    {isSubmitting ? 'Guardando...' : 'Confirmar Lectura'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectorDashboard;
