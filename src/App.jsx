import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import LandingPage from './components/LandingPage';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import EmailVerification from './components/EmailVerification';
import PaymentSuccess from './components/PaymentSuccess';
function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
           <Route path="/payment-success" element={<PaymentSuccess />} />
          {/* Catch all other routes */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;