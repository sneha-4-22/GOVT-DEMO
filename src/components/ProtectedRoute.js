import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const ProtectedRoute = ({ children }) => {
  const { current: user, loading, isVerified } = useUser();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Redirect if user is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if email is not verified
  if (!isVerified) {
    // Redirect to login which will show the verification prompt
    return <Navigate to="/login" replace />;
  }

  // If authenticated and verified, render the protected component
  return children;
};

export default ProtectedRoute;