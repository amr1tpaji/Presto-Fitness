import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  UtensilsCrossed,
  FlaskConical,
  CreditCard,
  Settings,
  Home,
  TrendingUp,
  Trophy,
  User as UserIcon,
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

export default function Sidebar({ isOpen, onClose }) {
  const { isAdmin } = useAuth();
  const sidebarItems = isAdmin ? adminItems : clientItems;

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-section">Main</div>
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <item.icon className="sidebar-icon" size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
