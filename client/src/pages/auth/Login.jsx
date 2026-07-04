import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useContext } from 'react';
import { ToastContext } from '../../context/ToastContext';
import { Phone, Lock, LogIn } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { APP_NAME } from '../../utils/constants';
import '../../styles/auth.css';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await login(phone, password);
      addToast('Welcome back!', 'success');
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/home');
    } catch (err) {
      const errMsg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Login failed';
      if (errMsg === 'PENDING_APPROVAL') {
        addToast('Your account is pending activation.', 'warning');
        navigate('/verify-key', { state: { identifier: phone } });
      } else {
        addToast(errMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">P</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to {APP_NAME}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label="Phone Number" type="tel" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} required />
          <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} required />
          <Button type="submit" variant="primary" fullWidth loading={loading} icon={<LogIn size={18} />}>Sign In</Button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create Account</Link></p>
        </div>
      </div>
    </div>
  );
}
