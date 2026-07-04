import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, User, Settings, LogOut, Menu, X } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout, isAdmin } = useAuth();
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
        <button className="navbar-hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link to={isAdmin ? '/admin/dashboard' : '/home'} className="navbar-brand">
          <div className="navbar-logo">P</div>
          <span className="navbar-brand-name">
            Presto <span>Fitness</span>
          </span>
        </Link>
      </div>

      <div className="navbar-right">
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
                  src={`/uploads/${user.avatar}`} 
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
