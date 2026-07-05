import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../context/ThemeContext';
import { ChevronDown, User, Settings, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

import { getImageUrl } from '../../services/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
        <Link to={isAdmin ? '/admin/dashboard' : '/home'} className="navbar-brand" style={{ marginLeft: 50 }}>
          <span className="navbar-brand-name">
            Presto <span>Fitness</span>
          </span>
        </Link>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={toggleTheme}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '50%', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, transition: 'all 0.2s ease' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="navbar-user" ref={dropdownRef}>
          <button
            className="navbar-user-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div 
              className="navbar-avatar" 
              style={{
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              {user?.avatar ? (
                <img 
                  src={getImageUrl(user.avatar)} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <span className="navbar-user-name">{user?.name || 'User'}</span>
            <ChevronDown size={16} style={{
              color: 'var(--text-muted)',
              transform: dropdownOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms ease',
            }} />
          </button>

          {dropdownOpen && (
            <div className="navbar-dropdown">
              <Link
                to={isAdmin ? '/admin/settings' : '/profile'}
                className="navbar-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={16} />
                Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/settings"
                  className="navbar-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings size={16} />
                  Settings
                </Link>
              )}
              <div className="navbar-dropdown-divider" />
              <button
                className="navbar-dropdown-item danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
