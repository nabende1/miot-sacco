import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import ProtectedRoute from './routes/ProtectedRoute';

// Assuming you have these dashboard components
import FacilitatorDashboard from './pages/FacilitatorDashboard'; 
// NOTE: Please ensure these imports match your file structure!
import SuperAdminDashboard from './pages/SuperAdminDashboard'; 
import GeneralManagerDashboard from './pages/GeneralManagerDashboard'; 
import BranchManagerDashboard from './pages/BranchManagerDashboard'; 
// import MemberDashboard from './pages/MemberDashboard'; 
// import NotFound from './pages/NotFound'; // Optional: for 404 page

export default function App() {
  return (
    <DataProvider>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected routes (Wrapped by ProtectedRoute) */}
          <Route element={<ProtectedRoute />}>
            
            {/* Define ALL role dashboards here */}
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/general-manager-dashboard" element={<GeneralManagerDashboard />} />
            <Route path="/branch-dashboard" element={<BranchManagerDashboard />} />
            <Route path="/facilitator-dashboard/*" element={<FacilitatorDashboard />} />
          
            
            {/* Catch-all protected route: Redirects unauthorized paths back to login */}
            {/* If you have a neutral dashboard, redirect there instead of /login */}
            <Route path="*" element={<Navigate to="/login" replace />} /> 
            
          </Route>
        </Routes>
      </div>
    </DataProvider>
  );
}