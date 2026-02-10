import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Devices from './pages/Devices';
import Assignments from './pages/Assignments';
import Reports from './pages/Reports';
import AdminUsers from './pages/AdminUsers';

// Placeholder common pages
const Placeholder = ({ title }) => (
  <div className="glass-card p-8 rounded-2xl">
    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    <p className="text-slate-500 mt-2">Estamos trabajando en esta sección. Pronto estará disponible.</p>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="devices" element={<Devices />} />
            <Route path="available-lines" element={<Devices initialFilter="disponible" title="Líneas Libres" />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin/users" element={
              <AdminUsers />
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
