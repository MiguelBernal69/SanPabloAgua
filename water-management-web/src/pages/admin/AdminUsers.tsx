import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, Mail, MapPin, MoreVertical, Edit2, Shield, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import type { Customer } from '../../types/index';

const AdminUsers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers');
        setCustomers(response.data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user?.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Directorio de Clientes</h1>
          <p className="text-slate-400 text-sm">Administración de usuarios y sus perfiles</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-primary-600/20 transition-all font-bold">
          <UserPlus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar por nombre, código de cliente o teléfono..." 
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-700/30 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5">Código</th>
                <th className="px-6 py-5">Teléfono</th>
                <th className="px-6 py-5">Dirección</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-700/20 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-primary-400 transition-colors">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-white">{customer.user?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-primary-500 font-bold bg-primary-500/10 px-2 py-1 rounded-md">
                      {customer.customer_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone className="w-3 h-3" />
                      {customer.user?.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400 max-w-[200px] truncate">
                      <MapPin className="w-3 h-3" />
                      {customer.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      customer.user?.is_active 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-red-500/10 text-red-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${customer.user?.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {customer.user?.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filteredCustomers.length === 0 && (
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-20 text-center text-slate-500 font-medium">
          No se encontraron clientes que coincidan con la búsqueda
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
