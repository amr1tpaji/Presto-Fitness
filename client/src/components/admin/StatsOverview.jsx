import { useState, useEffect, useContext } from 'react';
import { adminAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Users, CreditCard, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function StatsOverview() {
  const { addToast } = useContext(ToastContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getDashboardStats();
        setStats(res.data?.data || {});
      } catch (err) {
        addToast('Failed to load stats', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [addToast]);

  const cards = [
    {
      label: 'Total Clients',
      value: stats?.totalClients ?? 0,
      icon: <Users size={24} />,
      color: 'var(--info, #3b82f6)',
      trend: stats?.clientsTrend,
    },
    {
      label: 'Active Plans',
      value: stats?.activePlans ?? 0,
      icon: <CheckCircle2 size={24} />,
      color: 'var(--success, #22c55e)',
      trend: stats?.plansTrend,
    },
    {
      label: 'Revenue',
      value: `₹${(stats?.revenue ?? 0).toLocaleString('en-IN')}`,
      icon: <CreditCard size={24} />,
      color: 'var(--accent)',
      trend: stats?.revenueTrend,
    },
    {
      label: 'Completion Rate',
      value: `${stats?.completionRate ?? 0}%`,
      icon: <TrendingUp size={24} />,
      color: 'var(--warning, #f59e0b)',
      trend: stats?.completionTrend,
    },
  ];

  return (
    <div className="grid grid-4 gap-md">
      {cards.map((card) => (
        <div
          key={card.label}
          className="stat-card"
          style={{
            borderLeft: `3px solid ${card.color}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: '0.5rem 0' }}>
              <div
                style={{
                  width: '60%',
                  height: 12,
                  borderRadius: 6,
                  background: 'var(--bg-tertiary, #333)',
                  marginBottom: 12,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  width: '40%',
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--bg-tertiary, #333)',
                  marginBottom: 8,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.2s',
                }}
              />
              <div
                style={{
                  width: '50%',
                  height: 10,
                  borderRadius: 6,
                  background: 'var(--bg-tertiary, #333)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.4s',
                }}
              />
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 0.8; }
                }
              `}</style>
            </div>
          ) : (
            <>
              <div className="stat-card-icon" style={{ color: card.color }}>
                {card.icon}
              </div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">
                {card.label}
                {card.trend !== undefined && card.trend !== null && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: card.trend >= 0 ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)',
                    }}
                  >
                    {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}%
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
