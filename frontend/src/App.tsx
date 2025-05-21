import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Marketplace from './pages/Marketplace';
import Reviews from './pages/Reviews';
import Messages from './pages/Messages';
import Layout from './components/Layout';
import socketService from './services/socketService';
import './styles/theme.css';
import { AnimatePresence, motion } from 'framer-motion';

const AppRoutes: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user) {
      socketService.init();
      socketService.connect(user.email);
    } else {
      socketService.disconnect();
    }
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={
        <AnimatePresence mode="wait">
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {user ? <Navigate to="/dashboard" replace /> : <Login />}
          </motion.div>
        </AnimatePresence>
      } />
      <Route path="/register" element={
        <AnimatePresence mode="wait">
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {user ? <Navigate to="/dashboard" replace /> : <Register />}
          </motion.div>
        </AnimatePresence>
      } />
      
      {/* Protected routes with Layout */}
      <Route path="/dashboard" element={
        <Layout>
          <AnimatePresence mode="wait">
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
          {user ? <Dashboard /> : <Navigate to="/login" replace />}
            </motion.div>
          </AnimatePresence>
        </Layout>
      } />
      <Route path="/profile" element={
        <Layout>
          {user ? <Profile /> : <Navigate to="/login" replace />}
        </Layout>
      } />
      <Route path="/marketplace" element={
        <Layout>
          {user ? <Marketplace /> : <Navigate to="/login" replace />}
        </Layout>
      } />
      <Route path="/reviews" element={
        <Layout>
          {user ? <Reviews /> : <Navigate to="/login" replace />}
        </Layout>
      } />
      <Route path="/messages" element={
        <Layout>
          {user ? <Messages /> : <Navigate to="/login" replace />}
        </Layout>
      } />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
