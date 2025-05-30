import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tw } from '@twind/core';

const OTPVerification = () => {
  const location           = useLocation();
  const navigate           = useNavigate();
  const email              = location.state?.email || '';

  const [otpCode, setOtpCode] = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  /* redirect if opened w/o email */
  useEffect(() => {
    if (!email) navigate('/signup');
  }, [email, navigate]);

  /* countdown */
  useEffect(() => {
    if (resendTimer>0) {
      const t = setTimeout(()=>setResendTimer(resendTimer-1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  /* helpers */
  const handleOtpChange=(i,val)=>{
    if (val.length<=1 && /^[0-9]*$/.test(val)){
      const arr=[...otpCode]; arr[i]=val; setOtpCode(arr);
      if (val && i<5) document.getElementById(`otp-${i+1}`)?.focus();
    }
  };
  const handleKeyDown=(i,e)=>{
    if (e.key==='Backspace' && !otpCode[i] && i>0)
      document.getElementById(`otp-${i-1}`)?.focus();
  };

  /* verify */
  const handleVerify=async e=>{
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length!==6){ setError('Enter the 6-digit code'); return; }

    setLoading(true); setError('');
    try{
      const r = await fetch('http://localhost:5500/api/auth/verify-otp',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ email, otp: code })
      });
      const data = await r.json();

      if (r.ok){
        if (location.state?.isPasswordReset){
          /* go back to forgot-password step-2 */
          navigate('/forgot-password', { state:{ email, allowReset:true } });
        } else {
          /* normal sign-up flow */
          navigate('/login', {
            state:{ message:'Email verified successfully! Please login.' }
          });
        }
      } else setError(data.error || 'Invalid OTP');
    }catch{ setError('Network error. Try again.'); }
    finally{ setLoading(false); }
  };

  /* resend */
  const handleResend=async()=>{
    if (resendTimer>0) return;
    try{
      const r = await fetch('http://localhost:5500/api/auth/send-otp',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ email })
      });
      if (r.ok){
        setResendTimer(60); setError(''); setOtpCode(['','','','','','']);
      } else setError('Failed to resend code');
    }catch{ setError('Network error. Try again.'); }
  };

  /* UI */
  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center p-4')}>
      <div className={tw('w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden')}>
        <div className={tw('bg-gradient-to-r from-sky-100 to-teal-100 p-6')}>
          <h1 className={tw('text-4xl font-bold text-sky-400 text-center')}>AIDIY</h1>
        </div>

        <div className={tw('p-8 md:p-12')}>
          <div className={tw('grid md:grid-cols-2 gap-8 items-center')}>

            <div className={tw('max-w-md mx-auto w-full')}>
              <h2 className={tw('text-3xl font-bold text-gray-800 mb-3')}>Verify code</h2>
              <p className={tw('text-gray-600 mb-8')}>An authentication code has been sent to your email.</p>

              <form onSubmit={handleVerify}>
                <div className={tw('flex justify-center gap-2 mb-6')}>
                  {otpCode.map((d,i)=>(
                    <input key={i} id={`otp-${i}`} maxLength="1" type="text"
                      value={d}
                      onChange={e=>handleOtpChange(i,e.target.value)}
                      onKeyDown={e=>handleKeyDown(i,e)}
                      className={tw('w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all duration-300')}
                    />
                  ))}
                </div>

                {error && <p className={tw('text-red-500 text-sm text-center mb-4')}>{error}</p>}

                <p className={tw('text-gray-600 text-center mb-6')}>
                  Didn’t receive a code?{' '}
                  <button type="button" disabled={resendTimer>0}
                    onClick={handleResend}
                    className={tw(`ml-1 font-semibold ${resendTimer>0?'text-gray-400 cursor-not-allowed':'text-purple-600 hover:underline'}`)}
                  >
                    {resendTimer>0 ? `Resend (${resendTimer}s)` : 'Resend'}
                  </button>
                </p>

                <button type="submit" disabled={loading}
                  className={tw('w-full py-3 bg-gradient-to-r from-teal-400 to-purple-400 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed')}>
                  {loading ? 'Verifying…' : 'Verify'}
                </button>
              </form>
            </div>

            <div className={tw('hidden md:flex items-center justify-center')}>
              {/* decorative illustration */}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
