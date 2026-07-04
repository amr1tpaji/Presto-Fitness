import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Dumbbell, UtensilsCrossed,
  FlaskConical, CreditCard, Settings, Home, TrendingUp, Trophy, User as UserIcon, X, Menu
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

  // Unified Pointer Logic (Mouse + Touch)
  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    startPos.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y
    };
    setIsDragging(false);
  };

  const handlePointerMove = (e) => {
    if (!startPos.current.startX) return; // not pressed
    const dx = Math.abs(e.clientX - startPos.current.startX);
    const dy = Math.abs(e.clientY - startPos.current.startY);
    if (dx > 5 || dy > 5) {
      setIsDragging(true);
    }

    if (isDragging || dx > 5 || dy > 5) {
      let newX = e.clientX - startPos.current.offsetX;
      let newY = e.clientY - startPos.current.offsetY;
      newX = Math.max(0, Math.min(newX, window.innerWidth - 56));
      newY = Math.max(0, Math.min(newY, window.innerHeight - 56));
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    startPos.current = { startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
    
    // Give it a tiny tick before clearing isDragging so onClick can check it
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div 
        className="draggable-fab"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          position: 'fixed',
          zIndex: 9999,
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={(e) => {
          if (!isDragging) {
            setIsOpen(!isOpen);
          } else {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </div>

      {/* Floating Menu Popup */}
      {isOpen && (
        <>
          <div className="draggable-menu-overlay" onClick={() => setIsOpen(false)} />
          <div 
            className="draggable-menu"
            style={{
              position: 'fixed',
              left: `${Math.min(position.x, window.innerWidth - 220)}px`,
              top: `${Math.min(position.y - 280, window.innerHeight - 300)}px`,
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
