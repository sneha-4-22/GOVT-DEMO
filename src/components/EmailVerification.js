import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { AlertTriangle, CheckCircle, Mail, Youtube, ArrowLeft } from 'lucide-react';
import { account } from '../appwrite';

const EmailVerification = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUser();

  useEffect(() => {
    const checkVerification = async () => {
      try {
        // Get URL parameters - in Appwrite, they'll be userId and secret
        const params = new URLSearchParams(location.search);
        const userId = params.get('userId');
        const secret = params.get('secret');

        console.log("Verification params:", { userId, secret });

        if (!userId || !secret) {
          setStatus('error');
          setMessage('Invalid verification link. Missing required parameters.');
          return;
        }

        // Handle the Appwrite verification
        try {
          await account.updateVerification(userId, secret);
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now log in.');
          
          // Update verification status if user is logged in
          if (user.current) {
            await user.checkVerificationStatus();
          }
        } catch (confirmError) {
          console.error("Verification confirmation error:", confirmError);
          setStatus('error');
          
          if (confirmError.code === 401) {
            setMessage('The verification link has expired or is invalid. Please request a new one.');
          } else {
            setMessage(confirmError.message || 'Verification failed. Please try again.');
          }
          return;
        }
        
        // Auto redirect after success
        setTimeout(() => {
          // First logout to clear any existing session
          user.logout().finally(() => {
            navigate('/login');
          });
        }, 3000);
      } catch (error) {
        console.error("Verification error:", error);
        setStatus('error');
        
        if (error.code === 401) {
          setMessage('The verification link has expired or is invalid. Please request a new one.');
        } else {
          setMessage(error.message || 'Verification failed. Please try again.');
        }
      }
    };

    checkVerification();
  }, [location, navigate, user]);

  const resendVerification = async () => {
    try {
      // If not logged in, can't resend
      if (!user.current) {
        navigate('/login');
        return;
      }
      
      await user.sendNewVerificationEmail();
      setMessage('A new verification email has been sent. Please check your inbox.');
    } catch (error) {
      console.error("Error resending verification:", error);
      setMessage('Failed to send verification email. Please try again later.');
    }
  };

  const goToLogin = () => {
    // Logout first to clear any session issues
    user.logout().finally(() => {
      navigate('/login');
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="p-4 bg-gray-800 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Youtube className="text-red-600" />
            <h1 className="text-xl font-bold">YouTube Comment Analyzer</h1>
          </div>
          <button 
            onClick={goToLogin}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Verifying your email...</h2>
              <p className="text-gray-300">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6 flex justify-center">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Email Verified!</h2>
              <p className="text-gray-300 mb-6">{message}</p>
              <p className="text-gray-400">Redirecting you to the login page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-6 flex justify-center">
                <AlertTriangle size={48} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Verification Failed</h2>
              <p className="text-gray-300 mb-6">{message}</p>
              <button
                onClick={resendVerification}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded font-medium flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                Go to Login & Request New Verification
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmailVerification;