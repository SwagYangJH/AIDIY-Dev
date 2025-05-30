import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tw } from '@twind/core';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and privacy policy';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // First, register the user
      const response = await fetch('http://localhost:5500/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Send OTP to email
        await fetch('http://localhost:5500/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
        });
        
        // Navigate to OTP verification page
        navigate('/otp-verification', { state: { email: formData.email } });
      } else {
        setErrors({ submit: data.error || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Implement Google sign up
    console.log('Google sign up');
  };

  const handleFacebookSignUp = () => {
    // Implement Facebook sign up
    console.log('Facebook sign up');
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
              <h2 className={tw('text-3xl font-bold text-gray-800 mb-2')}>Sign Up</h2>
              <p className={tw('text-gray-600 mb-6')}>Let's get you set up to access your personal account</p>
              
              <form onSubmit={handleSubmit} className={tw('space-y-4')}>
                <div className={tw('grid grid-cols-2 gap-4')}>
                  <div>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                    />
                    {errors.firstName && (
                      <p className={tw('text-red-500 text-xs mt-1')}>{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                    />
                    {errors.lastName && (
                      <p className={tw('text-red-500 text-xs mt-1')}>{errors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email id"
                    className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                  />
                  {errors.email && (
                    <p className={tw('text-red-500 text-xs mt-1')}>{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                  />
                  {errors.phoneNumber && (
                    <p className={tw('text-red-500 text-xs mt-1')}>{errors.phoneNumber}</p>
                  )}
                </div>
                
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your new password"
                    className={tw('w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 transition-colors')}
                  />
                  {errors.password && (
                    <p className={tw('text-red-500 text-xs mt-1')}>{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <label className={tw('block text-sm font-medium text-gray-700 mb-1')}>
                    Confirm Password
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
                
                <div className={tw('flex items-center')}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className={tw('w-4 h-4 text-sky-400 border-gray-300 rounded focus:ring-sky-400')}
                  />
                  <label htmlFor="terms" className={tw('ml-2 text-sm text-gray-600')}>
                    I agree to all the Terms and Privacy Policies
                  </label>
                </div>
                {errors.terms && (
                  <p className={tw('text-red-500 text-xs')}>{errors.terms}</p>
                )}
                
                {errors.submit && (
                  <p className={tw('text-red-500 text-sm text-center')}>{errors.submit}</p>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className={tw('w-full py-3 bg-gradient-to-r from-teal-400 to-purple-400 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
              
              <div className={tw('mt-6 text-center')}>
                <p className={tw('text-gray-600')}>
                  Already have an account?{' '}
                  <Link to="/login" className={tw('text-purple-600 hover:underline font-semibold')}>
                    Login
                  </Link>
                </p>
              </div>
              
              <div className={tw('mt-6')}>
                <p className={tw('text-center text-gray-500 mb-4')}>or Sign up with</p>
                <div className={tw('grid grid-cols-2 gap-4')}>
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className={tw('flex items-center justify-center py-3 px-4 bg-gradient-to-r from-teal-300 to-purple-300 text-gray-700 font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300')}
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className={tw('w-5 h-5 mr-2')} />
                    Google
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleFacebookSignUp}
                    className={tw('flex items-center justify-center py-3 px-4 bg-gradient-to-r from-teal-300 to-purple-300 text-gray-700 font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300')}
                  >
                    <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className={tw('w-5 h-5 mr-2')} />
                    Facebook
                  </button>
                </div>
              </div>
            </div>
            
            {/* Image Section */}
            <div className={tw('hidden md:flex items-center justify-center')}>
              <div className={tw('relative')}>
                <div className={tw('absolute inset-0 bg-gradient-to-br from-purple-200 to-teal-200 rounded-full blur-3xl opacity-50')}></div>
                <img 
                  src="https://placehold.co/400x500/e0e7ff/7c3aed?text=AIDIY&font=roboto" 
                  alt="AIDIY App" 
                  className={tw('relative z-10 w-80 h-auto')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage; 