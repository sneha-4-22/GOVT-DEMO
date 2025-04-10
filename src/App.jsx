// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { UserProvider, useUser } from './contexts/UserContext';
import LandingPage from './components/LandingPage';
import LoginRegister from './components/LoginRegister';

import Dashboard from './components/Dashboard';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const user = useUser();
  
  if (user.loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>;
  }
  
  if (!user.current) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;