import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { tw } from '@twind/core';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Reset password for:', email);
  };

  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-primary-turquoise to-primary-turquoise-dark')}>
      {/* Header */}
      <header className={tw('bg-white shadow-sm')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('flex items-center justify-between h-20')}>
            <Link to="/" className={tw('flex items-center space-x-2')}>
              <span className={tw('text-3xl font-bold text-primary-turquoise')}>AI</span>
              <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Forgot Password Content */}
      <div className={tw('flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8')}>
        <div className={tw('max-w-5xl w-full')}>
          <div className={tw('grid grid-cols-1 lg:grid-cols-2 gap-8 items-center')}>
            {/* Forgot Password Card */}
            <div className={tw('bg-white rounded-2xl shadow-xl p-8')}>
              <Link to="/login" className={tw('inline-flex items-center text-primary-turquoise hover:underline mb-6 font-medium')}>
                ← Back to login
              </Link>
              
              <h2 className={tw('text-3xl font-bold text-gray-800 mb-3')}>Forgot Password</h2>
              <p className={tw('text-gray-500 mb-8 leading-relaxed')}>
                Forgot your password? Don't worry—Let us help you to reset your password.
              </p>

              <form onSubmit={handleResetPassword}>
                <div className={tw('space-y-5')}>
                  <div>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Email</label>
                    <input
                      type="email"
                      className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Enter new password</label>
                    <input
                      type="password"
                      className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Confirm password</label>
                    <input
                      type="password"
                      className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={tw('w-full mt-8 py-4 px-6 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold text-lg rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300')}
                >
                  Reset my password
                </button>
              </form>
            </div>

            {/* Forgot Password Illustration */}
            <div className={tw('hidden lg:flex items-center justify-center p-8')}>
              <div className={tw('relative w-80 h-80 bg-white/10 rounded-3xl flex items-center justify-center')}>
                <div className={tw('text-7xl mb-4 animate-pulse')}>🛡️</div>
                <div className={tw('absolute top-10 left-10 text-5xl animate-float')}>🔒</div>
                <div className={tw('absolute top-10 right-10 text-5xl animate-float')} style={{ animationDelay: '-0.5s' }}>🔑</div>
                <div className={tw('absolute bottom-10 left-1/2 transform -translate-x-1/2 text-5xl animate-float')} style={{ animationDelay: '-1.5s' }}>📧</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 