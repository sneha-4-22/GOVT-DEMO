// src/components/LoginRegister.js
import React, { useState } from 'react';

import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, User, Lock, Mail, ArrowLeft, Youtube
} from 'lucide-react';

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const user = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await user.login(email, password);
      } else {
        await user.register(email, password, name);
      }
      navigate('/dashboard');
    } catch (err) {
      const message = err.message || 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
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
        </div>
      </main>
    </div>
  );
};

export default LoginRegister;