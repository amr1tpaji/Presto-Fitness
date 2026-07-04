import { useState, useEffect, useContext } from 'react';
import { rewardsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Badge from '../common/Badge';
import { Trophy, Flame, Star, Award } from 'lucide-react';

export default function RewardManager({ clientId }) {
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
    if (clientId) fetchRewards();
  }, [clientId]);

  const fetchRewards = async () => {
    try {
      const { data } = await rewardsAPI.getClientRewards(clientId);
      setRewards(data);
    } catch {
      // No rewards yet
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex-center" style={{ padding: '40px' }}><div className="btn-spinner" style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /></div>;
  }

  const user = rewards?.user || {};
  const badges = user.rewards?.badges || [];
  const rewardList = rewards?.rewards || [];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            <Trophy size={24} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>
              {user.rewards?.points || 0}
            </div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total Points</div>
          </div>
        </div>
        <div className="card" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            <Flame size={24} style={{ color: '#f59e0b', marginBottom: '8px' }} />
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
              {user.rewards?.streak || 0}
            </div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Current Streak</div>
          </div>
        </div>
        <div className="card" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            <Star size={24} style={{ color: '#a78bfa', marginBottom: '8px' }} />
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>
              {user.rewards?.longestStreak || 0}
            </div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Longest Streak</div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <h4 style={{ marginBottom: '12px' }}>Earned Badges</h4>
      {badges.length === 0 ? (
        <div className="card" style={{ background: 'var(--bg-secondary)' }}>
          <div className="card-body text-center" style={{ padding: '32px' }}>
            <Award size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
            <p className="text-muted">No badges earned yet</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-3" style={{ marginBottom: '24px' }}>
          {badges.map((badge, i) => (
            <div key={i} className="card" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
              <div className="card-body" style={{ padding: '16px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{badge.icon || '🏅'}</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{badge.name}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Rewards */}
      {rewardList.length > 0 && (
        <>
          <h4 style={{ marginBottom: '12px' }}>Reward History</h4>
          <div className="flex-col gap-sm">
            {rewardList.slice(0, 10).map((r, i) => (
              <div key={i} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{r.title}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>{r.description}</div>
                </div>
                <div className="text-right">
                  <Badge variant="success" size="sm">+{r.pointsAwarded} pts</Badge>
                  <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                    {new Date(r.awardedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
