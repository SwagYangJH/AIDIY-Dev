import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

const LogoutButton = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    sessionStorage.removeItem('google_id_token');
    sessionStorage.removeItem('app_token');
    dispatch(logout());
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;
