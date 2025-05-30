import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tw } from '@twind/core';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCode = [...otpCode];
      newCode[index] = value;
      setOtpCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5500/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: code }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Navigate to login or dashboard
        navigate('/login', { state: { message: 'Email verified successfully! Please login.' } });
      } else {
        setError(data.error || 'Invalid OTP code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    try {
      const response = await fetch('http://localhost:5500/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setResendTimer(60);
        setError('');
        setOtpCode(['', '', '', '', '', '']);
      } else {
        setError('Failed to resend code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
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
            <div className={tw('max-w-md mx-auto w-full')}>
              <h2 className={tw('text-3xl font-bold text-gray-800 mb-3')}>Verify code</h2>
              <p className={tw('text-gray-600 mb-8')}>
                An authentication code has been sent to your email.
              </p>

              <form onSubmit={handleVerify}>
                <div className={tw('flex justify-center gap-2 mb-6')}>
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      className={tw('w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all duration-300')}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      maxLength="1"
                    />
                  ))}
                </div>

                {error && (
                  <p className={tw('text-red-500 text-sm text-center mb-4')}>{error}</p>
                )}

                <p className={tw('text-gray-600 text-center mb-6')}>
                  Didn't receive a code?{' '}
                  <button 
                    type="button" 
                    className={tw(`ml-1 font-semibold ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:underline cursor-pointer'}`)} 
                    onClick={handleResendCode}
                    disabled={resendTimer > 0}
                  >
                    {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend'}
                  </button>
                </p>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={tw('w-full py-3 bg-gradient-to-r from-teal-400 to-purple-400 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  {loading ? 'Verifying...' : 'Verify'}
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

export default OTPVerification; 