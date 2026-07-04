import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { rewardsAPI } from '../../services/api';
import RewardsView from '../../components/client/RewardsView';
import Loader from '../../components/common/Loader';
import { Trophy, Star, Clock } from 'lucide-react';
import '../../styles/client.css';

export default function MyRewards() {
  const { user } = useAuth();
  const [rewardsData, setRewardsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await rewardsAPI.getAll();
        const data = res.data?.rewards || res.data || {};
        setRewardsData(data);
        setActivities(data.recentActivity || data.activities || []);
      } catch {
        // use user data as fallback
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  const points = rewardsData?.points ?? user?.rewards?.points ?? 0;
  const streak = rewardsData?.streak ?? user?.rewards?.streak ?? 0;
  const earnedBadges = rewardsData?.badges || user?.rewards?.badges || [];

  if (loading) return <div className="page"><Loader /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trophy size={28} style={{ color: 'var(--accent)' }} /> My Rewards
        </h1>
        <p className="page-subtitle">Your achievements, badges, and streak</p>
      </div>

      <RewardsView points={points} streak={streak} earnedBadges={earnedBadges} />

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} /> Recent Activity
          </h2>
        </div>
        <div className="card-body">
          {activities.length === 0 ? (
            <div className="empty-state">
              <Star size={40} />
              <p className="text-muted">Complete tasks to earn points and badges!</p>
            </div>
          ) : (
            <div className="flex-col gap-sm">
              {activities.slice(0, 15).map((activity, idx) => (
                <div
                  key={activity._id || idx}
                  className="flex flex-between"
                  style={{
                    padding: '0.6rem 0',
                    borderBottom: '1px solid var(--border, #333)',
                    alignItems: 'center',
                  }}
                >
                  <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--accent-alpha, rgba(0,200,150,0.1))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                        fontSize: '0.9rem',
                      }}
                    >
                      {activity.icon || <Star size={16} />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{activity.title || activity.description}</p>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(activity.date || activity.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  {activity.points && (
                    <span
                      className="text-accent"
                      style={{
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        background: 'var(--accent-alpha, rgba(0,200,150,0.1))',
                        padding: '2px 10px',
                        borderRadius: 8,
                      }}
                    >
                      +{activity.points}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
