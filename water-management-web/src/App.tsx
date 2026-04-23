import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import LectorLayout from './components/layout/LectorLayout';
import LectorDashboard from './pages/lector/LectorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReadings from './pages/admin/AdminReadings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminLectores from './pages/admin/AdminLectores';
import UserDashboard from './pages/user/UserDashboard';
import UserPayments from './pages/user/UserPayments';
import DashboardLayout from './components/layout/DashboardLayout';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, token, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>;
  if (!token) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/lecturas" 
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <AdminReadings />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/usuarios" 
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <AdminUsers />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reportes" 
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <AdminReports />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/lectores" 
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <AdminLectores />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/lector" 
            element={
              <ProtectedRoute roles={['lector']}>
                <LectorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LectorDashboard />} />
            <Route path="perfil" element={<div className="p-8 text-white">Perfil del Lector (Próximamente)</div>} />
          </Route>
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute roles={['user']}>
                <DashboardLayout>
                  <UserDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/pagos" 
            element={
              <ProtectedRoute roles={['user']}>
                <DashboardLayout>
                  <UserPayments />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
