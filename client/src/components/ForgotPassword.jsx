import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tw } from '@twind/core';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter email, 2: Reset password

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEmail = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5500/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Navigate to OTP verification with reset password context
        navigate('/otp-verification', { 
          state: { 
            email: formData.email,
            isPasswordReset: true 
          } 
        });
      } else {
        setErrors({ submit: data.error || 'Failed to send OTP' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5500/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          newPassword: formData.newPassword
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        navigate('/login', { 
          state: { message: 'Password reset successfully! Please login with your new password.' } 
        });
      } else {
        setErrors({ submit: data.error || 'Failed to reset password' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center p-4')}>
      <div className={tw('w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden')}>
        <div className={tw('bg-gradient-to-r from-sky-100 to-teal-100 p-6')}>
          <h1 className={tw('text-4xl font-bold text-sky-400 text-center')}>AIDIY</h1>
        </div>
        
        <div className={tw('p-8 md:p-12')}>
          <div className={tw('grid md:grid-cols-2 gap-8 items-center')}>
            {/* Form Section */}
            <div>
              <Link to="/login" className={tw('inline-flex items-center text-purple-600 hover:underline mb-6 font-medium')}>
                ← Back to login
              </Link>
              
              <h2 className={tw('text-3xl font-bold text-gray-800 mb-3')}>Forgot Password</h2>
              <p className={tw('text-gray-600 mb-8')}>
                Forgot your password? Don't worry—Let us help you to reset your password.
              </p>

              <form onSubmit={step === 1 ? handleSendOTP : handleResetPassword}>
                <div className={tw('space-y-4')}>
                  <div>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your Email id"
                      className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                      disabled={step === 2}
                    />
                    {errors.email && (
                      <p className={tw('text-red-500 text-xs mt-1')}>{errors.email}</p>
                    )}
                  </div>

                  {step === 2 && (
                    <>
                      <div>
                        <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                          Enter new password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter your new password"
                          className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                        />
                        {errors.newPassword && (
                          <p className={tw('text-red-500 text-xs mt-1')}>{errors.newPassword}</p>
                        )}
                      </div>

                      <div>
                        <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                          Confirm password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                        />
                        {errors.confirmPassword && (
                          <p className={tw('text-red-500 text-xs mt-1')}>{errors.confirmPassword}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {errors.submit && (
                  <p className={tw('text-red-500 text-sm text-center mt-4')}>{errors.submit}</p>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className={tw('w-full mt-6 py-3 bg-gradient-to-r from-teal-400 to-purple-400 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  {loading ? 'Processing...' : (step === 1 ? 'Send OTP' : 'Reset my password')}
                </button>
              </form>
            </div>
            
            {/* Image Section */}
            <div className={tw('hidden md:flex items-center justify-center')}>
              <div className={tw('relative')}>
                <div className={tw('absolute inset-0 bg-gradient-to-br from-purple-200 to-teal-200 rounded-full blur-3xl opacity-50')}></div>
                <div className={tw('relative z-10 bg-gray-100 rounded-3xl p-12')}>
                  <div className={tw('flex items-center justify-center space-x-4')}>
                    <div className={tw('text-6xl')}>🔐</div>
                    <div className={tw('text-6xl')}>📧</div>
                  </div>
                  <div className={tw('mt-8 flex justify-center')}>
                    <div className={tw('bg-yellow-300 px-4 py-2 rounded-lg flex items-center space-x-2')}>
                      <span className={tw('text-2xl')}>✓</span>
                      <div className={tw('flex space-x-1')}>
                        {[...Array(8)].map((_, i) => (
                          <span key={i} className={tw('text-xl')}>*</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={tw('mt-4 flex justify-center space-x-2')}>
                    <div className={tw('text-3xl')}>🔑</div>
                    <div className={tw('text-3xl')}>⚙️</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 