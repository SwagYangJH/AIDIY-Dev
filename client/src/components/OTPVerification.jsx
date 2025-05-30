import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { tw } from '@twind/core';

const OTPVerification = () => {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '']);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCode = [...otpCode];
      newCode[index] = value;
      setOtpCode(newCode);
      
      if (value && index < 4) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const code = otpCode.join('');
    console.log('OTP Code:', code);
  };

  const handleResendCode = () => {
    console.log('Resending code...');
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

      {/* OTP Content */}
      <div className={tw('flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8')}>
        <div className={tw('max-w-5xl w-full')}>
          <div className={tw('grid grid-cols-1 lg:grid-cols-2 gap-8 items-center')}>
            {/* OTP Card */}
            <div className={tw('bg-white rounded-2xl shadow-xl p-8 text-center')}>
              <h2 className={tw('text-3xl font-bold text-gray-800 mb-3')}>Verify Code</h2>
              <p className={tw('text-gray-500 mb-8 leading-relaxed')}>
                An authentication code has been sent to your email.
              </p>

              <form onSubmit={handleVerify}>
                <div className={tw('flex justify-center gap-3 mb-8')}>
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      className={tw('w-16 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-turquoise focus:shadow-lg transition-all duration-300')}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      maxLength="1"
                    />
                  ))}
                </div>

                <p className={tw('text-gray-500 mb-8')}>
                  Didn't receive a code? 
                  <button 
                    type="button" 
                    className={tw('ml-1 text-primary-turquoise underline hover:no-underline font-medium')} 
                    onClick={handleResendCode}
                  >
                    Resend
                  </button>
                </p>

                <button 
                  type="submit" 
                  className={tw('w-full py-4 px-6 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold text-lg rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300')}
                >
                  Verify
                </button>
              </form>
            </div>

            {/* OTP Illustration */}
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

export default OTPVerification; 