import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  MapPin,
  Edit2,
  User as UserIcon,
  Users,
  X,
  Save,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  Hash,
} from 'lucide-react';
import api from '../../services/api';
import type { Customer } from '../../types/index';

type CustomerType = 'socio' | 'usuario';

// Genera el siguiente código correlativo según el tipo
const getNextCode = (customers: Customer[], type: CustomerType): string => {
  const prefix = type === 'socio' ? 'S-' : 'U-';
  const nums = customers
    .map((c) => c.customer_code)
    .filter((code) => code.toUpperCase().startsWith(prefix.toUpperCase()))
    .map((code) => parseInt(code.replace(/[^0-9]/g, ''), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

const TYPE_LABELS: Record<CustomerType, { label: string; color: string; bg: string; border: string }> = {
  socio:   { label: 'Socio',   color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  usuario: { label: 'Usuario', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
};

const getTypeFromCode = (code: string): CustomerType =>
  code.toUpperCase().startsWith('S-') ? 'socio' : 'usuario';

const AdminUsers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Status State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [customerType, setCustomerType] = useState<CustomerType>('socio');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    customer_code: '',
    is_active: true,
  });

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

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Recalcula el código cuando cambia el tipo (solo en modo creación)
  const handleTypeChange = (type: CustomerType) => {
    setCustomerType(type);
    setFormData((prev) => ({ ...prev, customer_code: getNextCode(customers, type) }));
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedCustomer(null);
    const defaultType: CustomerType = 'socio';
    setCustomerType(defaultType);
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      address: '',
      customer_code: getNextCode(customers, defaultType),
      is_active: true,
    });
    setSaveError('');
    setSaveSuccess(false);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setModalMode('edit');
    setSelectedCustomer(customer);
    setCustomerType(getTypeFromCode(customer.customer_code));
    setFormData({
      name: customer.user?.name || '',
      phone: customer.user?.phone || '',
      email: customer.user?.email || '',
      password: customer.user?.password_plain || '',
      address: customer.address || '',
      customer_code: customer.customer_code || '',
      is_active: customer.user?.is_active ?? true,
    });
    setSaveError('');
    setSaveSuccess(false);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');

    try {
      if (modalMode === 'create') {
        await api.post('/admin/users', {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          role: 'user',
          customer_code: formData.customer_code,
          address: formData.address,
        });
      } else if (selectedCustomer) {
        await api.put(`/admin/users/${selectedCustomer.user_id}`, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          is_active: formData.is_active,
        });
        await api.put(`/customers/${selectedCustomer.id}`, {
          address: formData.address,
        });
      }

      setSaveSuccess(true);
      fetchCustomers();
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (error: any) {
      setSaveError(error.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer || !window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/admin/users/${selectedCustomer.user_id}`);
      setIsModalOpen(false);
      fetchCustomers();
    } catch {
      alert('Error al eliminar usuario');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user?.phone.includes(searchTerm)
  );

  const totalSocios = customers.filter((c) => c.customer_code.toUpperCase().startsWith('S-')).length;
  const totalUsuarios = customers.filter((c) => c.customer_code.toUpperCase().startsWith('U-')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-400 text-sm">Administración central de socios y clientes</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-primary-600/20 transition-all font-bold"
        >
          <UserPlus className="w-5 h-5" />
          Registrar Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{customers.length}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total</p>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalSocios}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Socios</p>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalUsuarios}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Usuarios</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre, código o teléfono..."
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-700/30 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Cliente</th>
                  <th className="px-6 py-5">Código</th>
                  <th className="px-6 py-5">Teléfono</th>
                  <th className="px-6 py-5 text-right">Estado / Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredCustomers.map((customer) => {
                  const type = getTypeFromCode(customer.customer_code);
                  const typeInfo = TYPE_LABELS[type];
                  return (
                    <tr key={customer.id} className="hover:bg-slate-700/20 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-primary-400 transition-colors">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{customer.user?.name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {customer.address}
                            </p>
                            <p className="text-[9px] text-primary-500/70 font-black mt-1 uppercase flex items-center gap-1">
                              <Key className="w-2.5 h-2.5" /> Clave: {customer.user?.password_plain || '---'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-md border ${typeInfo.color} ${typeInfo.bg} ${typeInfo.border}`}>
                          <Hash className="w-3 h-3" />
                          {customer.customer_code}
                        </span>
                        <p className={`text-[9px] font-black uppercase tracking-wider mt-1 ml-0.5 ${typeInfo.color} opacity-70`}>
                          {typeInfo.label}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {customer.user?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            customer.user?.is_active
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {customer.user?.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-500 shadow-inner">
                  {modalMode === 'create' ? <UserPlus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalMode === 'create' ? 'Registrar Nuevo Cliente' : 'Editar Información'}
                  </h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    {modalMode === 'create' ? 'Asignación de cuenta y medidor' : selectedCustomer?.customer_code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto flex-1">
              {saveError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{saveError}</span>
                </div>
              )}
              {saveSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="font-medium">Operación realizada con éxito</span>
                </div>
              )}

              {/* Tipo selector – solo en creación */}
              {modalMode === 'create' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Tipo de Cliente
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['socio', 'usuario'] as CustomerType[]).map((t) => {
                      const info = TYPE_LABELS[t];
                      const active = customerType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleTypeChange(t)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                            active
                              ? `${info.bg} ${info.border} ${info.color}`
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          <Hash className="w-5 h-5" />
                          <span>{info.label}</span>
                          <span className="text-[10px] font-mono opacity-70">
                            {getNextCode(customers, t)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Código autogenerado (readonly en create, disabled en edit) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Código {modalMode === 'create' ? '(generado automáticamente)' : ''}
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    readOnly={modalMode === 'create'}
                    disabled={modalMode === 'edit'}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-4 text-sm outline-none transition-all font-mono font-bold ${
                      modalMode === 'create'
                        ? `${TYPE_LABELS[customerType].color} cursor-default`
                        : 'text-slate-400 disabled:opacity-50'
                    }`}
                    value={formData.customer_code}
                  />
                </div>
              </div>

              {/* Nombre + Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white text-sm focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono (Login)</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white text-sm focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  {modalMode === 'create' ? 'Contraseña Inicial' : 'Cambiar Contraseña'}
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={modalMode === 'create'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-12 py-4 text-white text-sm focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
                    placeholder={modalMode === 'edit' ? 'Dejar en blanco para no cambiar' : 'Mín. 6 caracteres'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección Exacta</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-4 text-white text-sm focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-slate-800 shadow-inner">
                <div>
                  <p className="text-sm font-bold text-white">Estado del Usuario</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mt-0.5">Acceso al portal y cobros</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-14 h-7 rounded-full transition-all relative ${formData.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${formData.is_active ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              {/* Botones */}
              <div className="pt-6 flex items-center justify-between gap-4 border-t border-slate-800">
                {modalMode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
                <div className="flex-1 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-4 rounded-2xl text-slate-400 font-bold hover:text-white transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-primary-600/30 disabled:opacity-50 text-sm"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {modalMode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
