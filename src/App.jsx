// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import GMDashboard from './pages/GMDashboard';
import BranchDashboard from './pages/BranchDashboard';
import FacilitatorDashboard from './pages/FacilitatorDashboard';
import LoanWorkflow from './pages/LoanWorkflow';
import WeeklyEntry from './pages/WeeklyEntry';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';

export default function App() {
  return (
    <DataProvider>
      <div className="App">
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/gm-dashboard" element={<GMDashboard />} />
            <Route path="/branch-dashboard" element={<BranchDashboard />} />
            <Route path="/facilitator-dashboard" element={<FacilitatorDashboard />} />
            <Route path="/loan-workflow" element={<LoanWorkflow />} />
            <Route path="/weekly-entry" element={<WeeklyEntry />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>

          {/* Default redirect based on role */}
          <Route path="/" element={<RoleRedirect />} />
        </Routes>
      </div>
    </DataProvider>
  );
}