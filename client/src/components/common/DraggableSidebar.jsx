import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Dumbbell, UtensilsCrossed,
  FlaskConical, CreditCard, Settings, Home, TrendingUp, Trophy, User as UserIcon, X, Menu, MessageCircle
} from 'lucide-react';

const adminItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/clients', icon: Users, label: 'Clients' },
  { to: '/admin/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/admin/diet-plans', icon: UtensilsCrossed, label: 'Diet Plans' },
  { to: '/admin/lab-reports', icon: FlaskConical, label: 'Lab Reports' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const clientItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/workout', icon: Dumbbell, label: 'My Workout' },
  { to: '/diet', icon: UtensilsCrossed, label: 'My Diet' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/rewards', icon: Trophy, label: 'Rewards' },
  { to: '/profile', icon: UserIcon, label: 'Profile' },
];

export default function DraggableSidebar() {
  const { isAdmin } = useAuth();
  const sidebarItems = isAdmin ? adminItems : clientItems;
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // For mobile floating menu
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 20, y: window.innerHeight - 150 });

  // Handle window resize to keep button on screen
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop returns the standard fixed sidebar
  if (!isMobile) {
    return (
      <aside className="sidebar open">
        <div className="sidebar-section">Main</div>
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="sidebar-icon" size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    );
  }

      {/* Fixed Menu Button at Top Left */}
      <button 
        className="draggable-fab"
        style={{
          left: '16px',
          top: '16px',
          position: 'fixed',
          zIndex: 9999,
          border: 'none',
          background: 'var(--accent)',
          color: '#000',
          width: 40,
          height: 40,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Floating Menu Popup */}
      {isOpen && (
        <>
          <div className="draggable-menu-overlay" onClick={() => setIsOpen(false)} />
          <div 
            className="draggable-menu"
            style={{
              position: 'fixed',
              left: '16px',
              top: '64px',
              zIndex: 9998
            }}
          >
            <nav className="sidebar-nav">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="sidebar-icon" size={20} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
