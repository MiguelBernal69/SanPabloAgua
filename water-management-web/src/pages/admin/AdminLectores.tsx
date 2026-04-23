import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Edit2,
  X,
  Save,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  ScanLine,
  Mail,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import api from '../../services/api';

interface Lector {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  is_active: boolean;
  password_plain?: string;
  created_at: string;
}

const AdminLectores: React.FC = () => {
  const [lectores, setLectores] = useState<Lector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedLector, setSelectedLector] = useState<Lector | null>(null);

  // Status State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    is_active: true,
  });

  const fetchLectores = async () => {
    try {
      const response = await api.get('/admin/users?role=lector');
      setLectores(response.data);
    } catch (error) {
      console.error('Error fetching lectores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectores();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedLector(null);
    setFormData({ name: '', phone: '', email: '', password: '', is_active: true });
    setSaveError('');
    setSaveSuccess(false);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (lector: Lector) => {
    setModalMode('edit');
    setSelectedLector(lector);
    setFormData({
      name: lector.name,
      phone: lector.phone,
      email: lector.email || '',
      password: lector.password_plain || '',
      is_active: lector.is_active,
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
          role: 'lector',
        });
      } else if (selectedLector) {
        await api.put(`/admin/users/${selectedLector.id}`, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          ...(formData.password ? { password: formData.password } : {}),
          is_active: formData.is_active,
        });
      }

      setSaveSuccess(true);
      fetchLectores();
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (error: any) {
      setSaveError(error.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !selectedLector ||
      !window.confirm(`¿Eliminar al lector "${selectedLector.name}"? Esta acción no se puede deshacer.`)
    )
      return;

    try {
      await api.delete(`/admin/users/${selectedLector.id}`);
      setIsModalOpen(false);
      fetchLectores();
    } catch {
      alert('Error al eliminar lector');
    }
  };

  const filteredLectores = lectores.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      (l.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Lectores</h1>
          <p className="text-slate-400 text-sm">Personal autorizado para registrar lecturas de medidores</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-cyan-600/20 transition-all font-bold"
        >
          <UserPlus className="w-5 h-5" />
          Agregar Lector
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{lectores.length}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Lectores</p>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{lectores.filter((l) => l.is_active).length}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Activos</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o correo..."
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Cargando lectores...</span>
          </div>
        ) : filteredLectores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-3">
            <ScanLine className="w-10 h-10" />
            <p className="text-sm font-medium">
              {searchTerm ? 'No se encontraron resultados' : 'No hay lectores registrados aún'}
            </p>
            {!searchTerm && (
              <button
                onClick={openCreateModal}
                className="text-cyan-500 hover:text-cyan-400 text-sm font-bold underline underline-offset-4 mt-1"
              >
                Agregar el primer lector
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-700/30 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Lector</th>
                  <th className="px-6 py-5">Teléfono</th>
                  <th className="px-6 py-5">Correo</th>
                  <th className="px-6 py-5 hidden md:table-cell">Contraseña</th>
                  <th className="px-6 py-5 text-right">Estado / Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredLectores.map((lector) => (
                  <tr key={lector.id} className="hover:bg-slate-700/20 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                          <ScanLine className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{lector.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Lector</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {lector.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{lector.email || '—'}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {lector.password_plain ? (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-md flex items-center gap-1 w-fit">
                          <Key className="w-2.5 h-2.5" />
                          {lector.password_plain}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            lector.is_active
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {lector.is_active ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <ShieldOff className="w-3 h-3" />
                          )}
                          {lector.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => openEditModal(lector)}
                          className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                          title="Editar lector"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/10 flex items-center justify-center text-cyan-400 shadow-inner">
                  {modalMode === 'create' ? (
                    <UserPlus className="w-6 h-6" />
                  ) : (
                    <Edit2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalMode === 'create' ? 'Registrar Lector' : 'Editar Lector'}
                  </h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    {modalMode === 'create' ? 'Acceso a la app móvil de lecturas' : selectedLector?.name}
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

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-8 space-y-5">
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

              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white text-sm focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 outline-none transition-all"
                  placeholder="Ej: Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Teléfono */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Teléfono (Login)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-4 text-white text-sm focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 outline-none transition-all"
                      placeholder="Ej: 099XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Correo */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Correo (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="email"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-4 text-white text-sm focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 outline-none transition-all"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  {modalMode === 'create' ? 'Contraseña' : 'Nueva Contraseña'}
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={modalMode === 'create'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-12 py-4 text-white text-sm focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 outline-none transition-all"
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

              {/* Estado (solo en edición) */}
              {modalMode === 'edit' && (
                <div className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-slate-800 shadow-inner">
                  <div>
                    <p className="text-sm font-bold text-white">Estado del Lector</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mt-0.5">
                      Acceso a la app móvil
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`w-14 h-7 rounded-full transition-all relative ${
                      formData.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                        formData.is_active ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-800">
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
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-cyan-600/30 disabled:opacity-50 text-sm"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {modalMode === 'create' ? 'Crear Lector' : 'Guardar Cambios'}
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

export default AdminLectores;
