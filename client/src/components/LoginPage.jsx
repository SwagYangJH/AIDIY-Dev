import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess } from '../store/authSlice';
import { tw } from '@twind/core';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kidCode, setKidCode] = useState(['', '', '', '']);
  const [rememberMe, setRememberMe] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(state => state.auth);

  // Google login handler
  const handleCredentialResponse = useCallback(async (response) => {
    const idToken = response.credential;
    sessionStorage.setItem("google_id_token", idToken);

    try {
      dispatch(loginStart());

      const res = await fetch("http://localhost:5500/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();
      sessionStorage.setItem("app_token", data.appToken);

      dispatch(loginSuccess(data.user));
      navigate('/profile');

    } catch (error) {
      console.error("Authentication failed:", error);
    }
  }, [dispatch, navigate]);

  // Initialize Google login
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      console.log('Attempting to initialize Google Sign-In...');
      console.log('window.google available:', !!window.google);
      console.log('activeTab:', activeTab);
      
      if (window.google && window.google.accounts && activeTab === 'parent') {
        try {
          window.google.accounts.id.initialize({
            client_id: '237672950587-0fjv71akur45kfao2gf7anggc0ft1fit.apps.googleusercontent.com',
            callback: handleCredentialResponse,
          });

          const googleSigninDiv = document.getElementById('google-signin');
          console.log('Google signin div found:', !!googleSigninDiv);
          
          if (googleSigninDiv) {
            googleSigninDiv.innerHTML = '';
            window.google.accounts.id.renderButton(
              googleSigninDiv,
              { 
                theme: 'outline', 
                size: 'large',
                width: '100%'
              }
            );
            console.log('Google button rendered successfully');
          }
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
        }
      } else {
        console.log('Google not ready, retrying in 1 second...');
        setTimeout(initializeGoogleSignIn, 1000);
      }
    };

    // Wait a bit for the component to mount and Google script to load
    const timer = setTimeout(initializeGoogleSignIn, 500);
    
    return () => clearTimeout(timer);
  }, [activeTab, handleCredentialResponse]);

  const handleParentLogin = async (e) => {
    e.preventDefault();
    try {
      dispatch(loginStart());

      const res = await fetch("http://localhost:5500/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (data.success) {
        sessionStorage.setItem("app_token", data.appToken);
        dispatch(loginSuccess(data.user));
        navigate('/profile');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert('Login failed. Please try again.');
    }
  };

  const handleKidLogin = async (e) => {
    e.preventDefault();
    const code = kidCode.join('');
    
    try {
      dispatch(loginStart());

      const res = await fetch("http://localhost:5500/api/auth/kid-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      
      if (data.success) {
        sessionStorage.setItem("app_token", data.appToken);
        dispatch(loginSuccess(data.user));
        navigate('/profile');
      } else {
        alert(data.error || 'Invalid kid code');
      }
    } catch (error) {
      console.error("Kid login failed:", error);
      alert('Login failed. Please try again.');
    }
  };

  const handleKidCodeChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCode = [...kidCode];
      newCode[index] = value;
      setKidCode(newCode);
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
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

      {/* Login Content */}
      <div className={tw('flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8')}>
        <div className={tw('max-w-5xl w-full')}>
          <div className={tw('grid grid-cols-1 lg:grid-cols-2 gap-8 items-center')}>
            {/* Login Card */}
            <div className={tw('bg-white rounded-2xl shadow-xl overflow-hidden')}>
              {/* Tab Navigation */}
              <div className={tw('flex border-b border-gray-200')}>
                <button 
                  className={tw(`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 ${
                    activeTab === 'parent' 
                      ? 'bg-accent-pink text-primary-turquoise border-b-4 border-primary-turquoise' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`)}
                  onClick={() => setActiveTab('parent')}
                >
                  Parent Login
                </button>
                <button 
                  className={tw(`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 ${
                    activeTab === 'kid' 
                      ? 'bg-accent-pink text-primary-turquoise border-b-4 border-primary-turquoise' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`)}
                  onClick={() => setActiveTab('kid')}
                >
                  Kid Login
                </button>
              </div>

              {/* Parent Login Form */}
              {activeTab === 'parent' && (
                <div className={tw('p-8')}>
                  <h2 className={tw('text-2xl font-bold text-gray-800 mb-2')}>Parent Login</h2>
                  <p className={tw('text-gray-500 mb-6')}>Login or access your AI DIY account.</p>

                  {/* Social Login */}
                  <div className={tw('space-y-3 mb-6')}>
                    <div id="google-signin" className={tw('w-full')}></div>
                    <button className={tw('w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-blue-600 rounded-lg font-semibold text-blue-600 hover:bg-blue-50 transition-colors')}>
                      <span className={tw('w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold')}>f</span>
                      Facebook
                    </button>
                  </div>

                  <div className={tw('relative mb-6')}>
                    <div className={tw('absolute inset-0 flex items-center')}>
                      <div className={tw('w-full border-t border-gray-300')}></div>
                    </div>
                    <div className={tw('relative flex justify-center text-sm')}>
                      <span className={tw('px-2 bg-white text-gray-500')}>Or login with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleParentLogin}>
                    <div className={tw('space-y-4')}>
                      <div>
                        <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>Email</label>
                        <input
                          type="email"
                          className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                          placeholder="Enter your email id"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>Password</label>
                        <input
                          type="password"
                          className={tw('w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className={tw('flex items-center justify-between')}>
                        <label className={tw('flex items-center')}>
                          <input
                            type="checkbox"
                            className={tw('mr-2')}
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span className={tw('text-sm text-gray-600')}>I agree to the terms</span>
                        </label>
                        <Link to="/forgot-password" className={tw('text-sm text-primary-turquoise hover:underline')}>
                          Forgot Password?
                        </Link>
                      </div>

                      <button 
                        type="submit" 
                        className={tw('w-full py-3 px-4 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300')}
                        disabled={loading}
                      >
                        {loading ? 'Logging in...' : 'Log in as parent'}
                      </button>
                    </div>
                  </form>

                  <p className={tw('text-center text-gray-600 mt-6')}>
                    First time here? <Link to="/signup" className={tw('text-primary-turquoise hover:underline')}>Sign up</Link>
                  </p>
                </div>
              )}

              {/* Kid Login Form */}
              {activeTab === 'kid' && (
                <div className={tw('p-8')}>
                  <h2 className={tw('text-2xl font-bold text-gray-800 mb-2')}>Kid Login</h2>
                  <p className={tw('text-gray-500 mb-2')}>Login to access your AI DIY account.</p>
                  <p className={tw('text-gray-500 mb-2')}>You need code from your parent to get started</p>
                  <p className={tw('text-gray-500 mb-6')}>Enter your code to login</p>

                  <form onSubmit={handleKidLogin}>
                    <div className={tw('flex justify-center gap-4 mb-6')}>
                      {kidCode.map((digit, index) => (
                        <input
                          key={index}
                          id={`code-${index}`}
                          type="text"
                          className={tw('w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                          value={digit}
                          onChange={(e) => handleKidCodeChange(index, e.target.value)}
                          maxLength="1"
                        />
                      ))}
                    </div>

                    <label className={tw('flex items-center justify-center mb-6')}>
                      <input type="checkbox" className={tw('mr-2')} />
                      <span className={tw('text-gray-600')}>Remember Me</span>
                    </label>

                    <button 
                      type="submit" 
                      className={tw('w-full py-3 px-4 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300')}
                    >
                      Log in as kid
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Login Illustration */}
            <div className={tw('hidden lg:flex items-center justify-center p-8')}>
              <div className={tw('relative w-64 h-96 bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-5 shadow-2xl')}>
                <div className={tw('w-full h-full bg-white rounded-2xl flex items-center justify-center')}>
                  <div className={tw('text-center')}>
                    <div className={tw('w-20 h-20 mx-auto mb-6 bg-green-400 rounded-full flex items-center justify-center text-white text-3xl animate-pulse')}>
                      ✓
                    </div>
                    <div className={tw('text-5xl mb-4 opacity-30')}>🔒</div>
                    <div className={tw('flex justify-center gap-2')}>
                      {[0, 1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className={tw('w-3 h-3 bg-primary-turquoise rounded-full animate-dot-blink')}
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
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

export default LoginPage; 