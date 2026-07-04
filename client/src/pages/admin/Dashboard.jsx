import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import StatsOverview from '../../components/admin/StatsOverview';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import { Users, Dumbbell, UtensilsCrossed, ArrowRight, Crown } from 'lucide-react';
import '../../styles/dashboard.css';

export default function Dashboard() {
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
    fetchRecentClients();
  }, []);

  const fetchRecentClients = async () => {
    try {
      const res = await adminAPI.getClients({ limit: 5 });
      setRecentClients(res.data?.data?.clients || []);
    } catch (err) {
      addToast('Failed to load recent clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Workout',
      description: 'Create a new workout plan for a client',
      icon: <Dumbbell size={24} />,
      link: '/admin/workouts',
      color: 'var(--accent)',
    },
    {
      title: 'Add Diet Plan',
      description: 'Design a nutrition plan with macros',
      icon: <UtensilsCrossed size={24} />,
      link: '/admin/diet-plans',
      color: 'var(--success, #22c55e)',
    },
    {
      title: 'View Clients',
      description: 'Manage all your clients',
      icon: <Users size={24} />,
      link: '/admin/clients',
      color: 'var(--info, #3b82f6)',
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your overview.</p>
        </div>
      </div>

      <StatsOverview />

      <div className="grid grid-3 gap-md" style={{ marginTop: '2rem' }}>
        {quickActions.map((action) => (
          <Link
            key={action.title}
            to={action.link}
            className="card"
            style={{
              textDecoration: 'none',
              borderLeft: `3px solid ${action.color}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
            }}
          >
            <div className="card-body">
              <div className="flex flex-between" style={{ alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${action.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: action.color,
                  }}
                >
                  {action.icon}
                </div>
                <ArrowRight size={18} className="text-muted" />
              </div>
              <h3 style={{ margin: '1rem 0 0.25rem', color: 'var(--text-primary)' }}>{action.title}</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header flex flex-between" style={{ alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Clients</h2>
          <Link to="/admin/clients" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="card-body">
          {loading ? (
            <Loader />
          ) : recentClients.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>No clients yet. Start by adding your first client!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.map((client) => (
                    <tr key={client._id || client.id}>
                      <td>
                        <Link
                          to={`/admin/clients/${client._id || client.id}`}
                          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}
                        >
                          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--bg-primary, #000)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                              }}
                            >
                              {client.avatar ? (
                                <img 
                                  src={`/uploads/${client.avatar}`} 
                                  alt="Avatar" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                                />
                              ) : (
                                (client.name || 'U')[0].toUpperCase()
                              )}
                            </div>
                            {client.name || 'Unknown'}
                          </div>
                        </Link>
                      </td>
                      <td className="text-muted">{client.phone}</td>
                      <td>
                        <Badge variant={client.subscription?.status === 'active' ? 'success' : 'warning'}>
                          {client.subscription?.status || 'inactive'}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          🔥 {client.streak || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
