import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { register, clearError } from './authSlice';

const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordError('');
    dispatch(register({ name, email, password }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Logo and Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-primary">TradeTide</h1>
            <p className="text-gray-500 mt-2">Skill Trading Platform</p>
          </div>
          
          {/* Register Card */}
          <div className="card">
            <div className="card-header bg-white">
              <h2 className="text-xl font-semibold text-center">Create an Account</h2>
            </div>
            
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      dispatch(clearError());
                    }}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      dispatch(clearError());
                    }}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      dispatch(clearError());
                      if (confirmPassword && e.target.value !== confirmPassword) {
                        setPasswordError('Passwords do not match');
                      } else {
                        setPasswordError('');
                      }
                    }}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (password !== e.target.value) {
                        setPasswordError('Passwords do not match');
                      } else {
                        setPasswordError('');
                      }
                    }}
                    required
                  />
                </div>
                
                {passwordError && (
                  <div className="bg-red-50 text-error p-3 rounded-lg mb-4 text-sm">
                    {passwordError}
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 text-error p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading || !!passwordError}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
                
                <p className="text-xs text-gray-500 mt-4">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </div>
            
            <div className="card-footer bg-white text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 