import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/common/Navbar';
import DraggableSidebar from './components/common/DraggableSidebar';
import Loader from './components/common/Loader';
import Toast from './components/common/Toast';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OTPVerify from './pages/auth/OTPVerify';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ClientList from './pages/admin/ClientList';
import ClientDetail from './pages/admin/ClientDetail';
import Workouts from './pages/admin/Workouts';
import DietPlans from './pages/admin/DietPlans';
import LabReports from './pages/admin/LabReports';
import Payments from './pages/admin/Payments';
import AdminSettings from './pages/admin/Settings';

// Client pages
import ClientHome from './pages/client/Home';
import MyWorkout from './pages/client/MyWorkout';
import MyDiet from './pages/client/MyDiet';
import LogMeal from './pages/client/LogMeal';
import MyProgress from './pages/client/MyProgress';
import MyRewards from './pages/client/MyRewards';
import Profile from './pages/client/Profile';

// Client bottom tab bar
import { Home, Dumbbell, UtensilsCrossed, TrendingUp, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Loader />;
  return isAdmin ? <Outlet /> : <Navigate to="/home" replace />;
}

function AdminLayout() {
  return (
    <div className="admin-layout">
      <Navbar />
      <DraggableSidebar />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

function ClientLayout() {
  return (
    <div className="client-layout">
      <Navbar />
      <DraggableSidebar />
      <main className="client-main">
        <Outlet />
      </main>
      <nav className="client-bottom-tabs hide-desktop">
        <NavLink to="/home" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/workout" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <Dumbbell size={20} />
          <span>Workout</span>
        </NavLink>
        <NavLink to="/diet" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <UtensilsCrossed size={20} />
          <span>Diet</span>
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <TrendingUp size={20} />
          <span>Progress</span>
        </NavLink>
        <NavLink to="/rewards" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <Trophy size={20} />
          <span>Rewards</span>
        </NavLink>
      </nav>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <>
      <Toast />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<OTPVerify />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/clients" element={<ClientList />} />
              <Route path="/admin/clients/:id" element={<ClientDetail />} />
              <Route path="/admin/workouts" element={<Workouts />} />
              <Route path="/admin/diet-plans" element={<DietPlans />} />
              <Route path="/admin/lab-reports" element={<LabReports />} />
              <Route path="/admin/payments" element={<Payments />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>

        {/* Client routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ClientLayout />}>
            <Route path="/home" element={<ClientHome />} />
            <Route path="/meals/log" element={<LogMeal />} />
            <Route path="/workout" element={<MyWorkout />} />
            <Route path="/diet" element={<MyDiet />} />
            <Route path="/progress" element={<MyProgress />} />
            <Route path="/rewards" element={<MyRewards />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
