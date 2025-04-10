import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, User, Lock, Mail, ArrowLeft, Youtube, CheckCircle, Info
} from 'lucide-react';

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const user = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const result = await user.login(email, password);
        
        // Check if email verification is required and not yet done
        if (!result.isVerified) {
          setError('Please verify your email before logging in.');
          try {
            await user.sendNewVerificationEmail();
            setVerificationSent(true);
          } catch (verifyError) {
            console.error("Failed to send verification email:", verifyError);
            // Still show verification UI even if sending fails
            setVerificationSent(true);
          }
          setLoading(false);
          return;
        }
        
        // If verified, proceed to dashboard
        navigate('/dashboard');
      } else {
        // Registration
        try {
          await user.register(email, password, name);
          setVerificationSent(true);
        } catch (regError) {
          // If registration fails due to existing user
          if (regError.message.includes("already exists")) {
            setError(regError.message);
          } else {
            setError(regError.message || 'Registration failed. Please try again.');
          }
        }
      }
    } catch (err) {
      const message = err.message || 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      setLoading(true);
      // If not logged in but trying to resend verification, sign in first
      if (!user.current && email && password) {
        try {
          await user.login(email, password);
        } catch (loginErr) {
          // Even if login fails, we still try to send verification
          console.warn("Login failed when resending verification:", loginErr);
        }
      }
      
      await user.sendNewVerificationEmail();
      setVerificationSent(true);
      setError('');
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setVerificationSent(false);
  };

  const goBack = () => {
    navigate('/');
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
            onClick={goBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
          {verificationSent ? (
            <>
              <div className="text-center mb-6">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold">Verification Email Sent!</h2>
              </div>
              <p className="text-gray-300 mb-6 text-center">
                We've sent a verification email to <span className="font-bold">{email}</span>. 
                Please check your inbox and click the verification link to complete your registration.
              </p>
              <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                  <p className="text-sm text-gray-300">
                    If you don't see the email, please check your spam folder. The verification link will expire in 24 hours.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  onClick={resendVerification}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded font-medium"
                >
                  {loading ? 'Sending...' : 'Resend Verification Email'}
                </button>
                <button
                  onClick={toggleMode}
                  className="w-full py-2 px-4 bg-transparent border border-gray-600 hover:border-gray-500 rounded font-medium"
                >
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">
                {isLogin ? 'Log in to your account' : 'Create your account'}
              </h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <p>{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required={!isLogin}
                        className="pl-10 w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="pl-10 w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="pl-10 w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 px-4 rounded font-medium ${
                    loading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  } transition`}
                >
                  {loading 
                    ? 'Processing...' 
                    : isLogin ? 'Sign In' : 'Create Account'
                  }
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default LoginRegister;