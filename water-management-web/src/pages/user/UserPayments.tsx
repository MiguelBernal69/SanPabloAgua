import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Receipt, Download, Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Payment } from '../../types/index';

const UserPayments: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.customer?.id) return;
      try {
        const response = await api.get(`/payments/customer/${user.customer.id}`);
        setPayments(response.data);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [user]);

  const filteredPayments = payments.filter(p => 
    p.amount.toString().includes(searchTerm) || 
    p.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Pagos</h1>
          <p className="text-slate-400 text-sm">Consulta todos tus recibos y transacciones realizadas</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar por monto o método..." 
            className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-700/30 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Fecha de Pago</th>
                <th className="px-6 py-5">Método</th>
                <th className="px-6 py-5 text-right">Monto Pagado</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-700/20 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg text-slate-500 group-hover:text-primary-500 transition-colors">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-slate-300 font-medium">
                        {new Date(p.payment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold uppercase text-slate-500 bg-slate-900 px-2 py-1 rounded-md">
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-lg font-black text-emerald-500">Bs. {p.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-xs font-bold transition-colors">
                      <Download className="w-4 h-4" />
                      Recibo
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Receipt className="w-12 h-12 opacity-20" />
                      <p>No se encontraron registros de pagos</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex items-start gap-4">
        <div className="p-3 bg-primary-500/10 rounded-xl text-primary-500">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-white font-bold mb-1">¿Necesitas ayuda con tus pagos?</h4>
          <p className="text-slate-400 text-sm leading-relaxed">Si notas alguna discrepancia en tu historial o necesitas un recibo físico sellado, por favor acude a las oficinas de administración de San Pablo.</p>
        </div>
      </div>
    </div>
  );
};

export default UserPayments;
