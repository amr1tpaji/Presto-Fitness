import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContext } from '../../context/ToastContext';
import { authAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import '../../styles/auth.css';

export default function KeyVerify() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const { addToast } = useContext(ToastContext);
  const { verifyKey } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Passed from Register.jsx or Login.jsx
  const identifier = location.state?.email || location.state?.identifier;

  useEffect(() => {
    if (!identifier) {
      addToast('Session expired. Please register again.', 'error');
      navigate('/register', { replace: true });
    }
  }, [identifier, navigate, addToast]);



  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);



  const handleChange = useCallback((index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  }, [otp]);

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      addToast('Please enter the complete 6-digit Activation Key', 'error');
      return;
    }
    setLoading(true);
    try {
      await verifyKey(identifier, code);
      
      addToast('Account activated successfully!', 'success');
      navigate('/home', { replace: true });
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Invalid Key', 'error');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (!identifier) return null;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <ShieldCheck size={32} />
          </div>
          <h1 className="auth-title">Account Pending</h1>
          <p className="auth-subtitle">
            Your account is locked. Please ask your trainer for your 6-digit access key.<br />
            <strong style={{ color: 'var(--accent)', letterSpacing: '1px' }}>{identifier}</strong>
          </p>
        </div>
        <div className="auth-form">
          <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-input ${digit ? 'filled' : ''}`}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Your trainer can find this key on their Admin Dashboard.
            </p>
          </div>

          <Button
            variant="primary"
            fullWidth
            loading={loading}
            onClick={handleVerify}
            icon={<ShieldCheck size={18} />}
          >
            Verify & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
