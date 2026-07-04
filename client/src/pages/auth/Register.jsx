import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContext } from '../../context/ToastContext';
import { User, Phone, Lock, ShieldCheck, UserPlus, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { APP_NAME } from '../../utils/constants';
import { authAPI } from '../../services/api';
import '../../styles/auth.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number (e.g. 9876543210)';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authAPI.register({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      
      const fallbackOtp = res.data?.data?.fallbackOtp;

      if (fallbackOtp) {
        addToast(`[TESTING MODE] Your OTP is: ${fallbackOtp}`, 'warning');
      } else {
        addToast('Code sent to your email!', 'success');
      }
      
      navigate('/verify-otp', { 
        state: { 
          email: formData.email.trim(),
        } 
      });
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <div className="auth-brand">
          <div className="auth-logo">P</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join {APP_NAME} today</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange('name')}
              icon={<User size={18} />}
              required
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange('email')}
              icon={<Mail size={18} />}
              required
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your 10-digit phone number"
              value={formData.phone}
              onChange={handleChange('phone')}
              icon={<Phone size={18} />}
              required
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>
          <div className="form-group">
            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange('password')}
              icon={<Lock size={18} />}
              required
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              icon={<ShieldCheck size={18} />}
              required
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <Button type="submit" variant="primary" fullWidth loading={loading} icon={<UserPlus size={18} />}>
            Create Account
          </Button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}

