import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Marketplace from './pages/Marketplace';
import NotificationsBell from './features/notifications/NotificationsBell';
import './App.css'

const AppRoutes: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  // Hide nav links on dashboard
  const showNav = !user && (location.pathname === '/login' || location.pathname === '/register');

  return (
    <>
      {user && (
        <div className="flex justify-end items-center px-6 py-3 border-b bg-white sticky top-0 z-40">
          <NotificationsBell />
        </div>
      )}
      {showNav && (
        <div className="flex justify-center mt-8 space-x-4">
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          <Link to="/register" className="text-green-600 hover:underline">Register</Link>
        </div>
      )}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
        <Route path="/marketplace" element={user ? <Marketplace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
