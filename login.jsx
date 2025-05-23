import { useEffect } from 'react';

const Login = () => {
  useEffect(() => {
    /* global google */
    window.google.accounts.id.initialize({
      client_id: '237672950587-0fjv71akur45kfao2gf7anggc0ft1fit.apps.googleusercontent.com',
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-signin'),
      { theme: 'outline', size: 'large' }
    );
  }, []);

  const handleCredentialResponse = (response) => {
    console.log("Encoded JWT ID token: " + response.credential);
    // You'll send this to your backend in Step 2
  };

  return (
    <div>
      <h2>Login</h2>
      <div id="google-signin"></div>
    </div>
  );
};

export default Login;
