import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess } from '../redux/authSlice';

const Login = () => {
  const dispatch = useDispatch();

  const handleCredentialResponse = async (response) => {
    const idToken = response.credential;
    sessionStorage.setItem("google_id_token", idToken);

    try {
      dispatch(loginStart());

      const res = await fetch("http://localhost:5000/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();
      sessionStorage.setItem("app_token", data.appToken);

      dispatch(loginSuccess(data.user)); // adjust to match backend user format

    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  useEffect(() => {

    window.google.accounts.id.initialize({
      client_id: '237672950587-0fjv71akur45kfao2gf7anggc0ft1fit.apps.googleusercontent.com',
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-signin'),
      { theme: 'outline', size: 'large' }
    );
  }, []);

  return (
    <div>
      <h2>Login</h2>
      <div id="google-signin"></div>
    </div>
  );
};

export default Login;
