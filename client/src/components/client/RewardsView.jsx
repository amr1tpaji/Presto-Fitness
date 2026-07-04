import { useState, useEffect, useRef } from 'react';
import { BADGE_LIST } from '../../utils/constants';
import { Star, Lock } from 'lucide-react';

const DEFAULT_BADGES = [
  { id: 'first-workout', title: 'First Workout', description: 'Complete your first workout', icon: '💪' },
  { id: 'streak-7', title: '7-Day Streak', description: 'Maintain a 7-day streak', icon: '🔥' },
  { id: 'streak-30', title: '30-Day Streak', description: 'Maintain a 30-day streak', icon: '⚡' },
  { id: 'weight-goal', title: 'Weight Goal', description: 'Reach your target weight', icon: '🎯' },
  { id: 'perfect-week', title: 'Perfect Week', description: 'Complete all tasks for 7 days', icon: '⭐' },
  { id: '100-points', title: 'Century', description: 'Earn 100 points', icon: '💯' },
  { id: '500-points', title: 'Half-K', description: 'Earn 500 points', icon: '🏅' },
  { id: '1000-points', title: 'Grand', description: 'Earn 1000 points', icon: '👑' },
  { id: 'meal-master', title: 'Meal Master', description: 'Log meals for 14 consecutive days', icon: '🍽️' },
  { id: 'hydration-hero', title: 'Hydration Hero', description: 'Meet water goal for 21 days', icon: '💧' },
  { id: 'early-bird', title: 'Early Bird', description: 'Log workout before 8 AM 10 times', icon: '🌅' },
  { id: 'iron-will', title: 'Iron Will', description: 'Never miss a workout for 30 days', icon: '🦾' },
];

function AnimatedNumber({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = 0;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

export default function RewardsView({ points = 0, streak = 0, earnedBadges = [] }) {
  const badges = BADGE_LIST || DEFAULT_BADGES;
  const earnedIds = earnedBadges.map((b) => (typeof b === 'string' ? b : b.id || b.badgeId));

  return (
    <div>
      <div className="grid grid-2 gap-md" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-body" style={{ padding: '2rem 1rem' }}>
            <Star size={32} style={{ color: 'var(--accent)', marginBottom: 8 }} />
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
              <AnimatedNumber value={points} />
            </div>
            <p className="text-muted" style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Total Points</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-body" style={{ padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              >
                🔥
              </span>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--warning, #f59e0b)', lineHeight: 1 }}>
              <AnimatedNumber value={streak} />
            </div>
            <p className="text-muted" style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Day Streak</p>
            <style>{`
              @keyframes pulse-glow {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.15); opacity: 0.8; }
              }
            `}</style>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            🏆 Badge Collection
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>
              ({earnedIds.length}/{badges.length} earned)
            </span>
          </h3>
        </div>
        <div className="card-body">
          <div
            className="rewards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '1rem',
            }}
          >
            {badges.map((badge) => {
              const isEarned = earnedIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className="badge-card"
                  style={{
                    textAlign: 'center',
                    padding: '1.25rem 0.5rem',
                    borderRadius: 14,
                    background: isEarned
                      ? 'var(--bg-secondary, #111)'
                      : 'var(--bg-tertiary, #1a1a1a)',
                    border: `1px solid ${isEarned ? 'var(--accent)' : 'var(--border, #333)'}`,
                    opacity: isEarned ? 1 : 0.45,
                    boxShadow: isEarned
                      ? '0 0 20px rgba(0,200,150,0.15), inset 0 0 20px rgba(0,200,150,0.03)'
                      : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                >
                  {!isEarned && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'var(--text-muted, #888)',
                      }}
                    >
                      <Lock size={12} />
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '2rem',
                      marginBottom: 6,
                      filter: isEarned ? 'none' : 'grayscale(100%)',
                    }}
                  >
                    {badge.icon}
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                    {badge.name || badge.title}
                  </p>
                  <p
                    className="text-muted"
                    style={{ margin: '4px 0 0', fontSize: '0.65rem', lineHeight: 1.3 }}
                  >
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
