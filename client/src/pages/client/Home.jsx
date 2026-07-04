import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { tasksAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import {
  Sun, Moon, Sunrise, CheckCircle2, Circle, Flame, Scale,
  Target, Star, UtensilsCrossed, Dumbbell, Apple, Sparkles,
} from 'lucide-react';
import '../../styles/client.css';

const QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Success is what comes after you stop making excuses.",
  "Discipline is choosing between what you want now and what you want most.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Don't limit your challenges. Challenge your limits.",
  "Every rep counts, every meal matters, every day is progress.",
];

export default function Home() {
  const { user } = useAuth();
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: <Sunrise size={24} /> };
    if (hour < 17) return { text: 'Good Afternoon', icon: <Sun size={24} /> };
    return { text: 'Good Evening', icon: <Moon size={24} /> };
  }, []);

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await tasksAPI.getToday();
      setTasks(res.data?.data?.dailyTask?.tasks || []);
    } catch (err) {
      addToast('Failed to load today\'s tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCompleteTask = async (taskId) => {
    setCompletingTask(taskId);
    try {
      await tasksAPI.complete(taskId);
      setTasks((prev) =>
        prev.map((t) => {
          const id = t._id || t.id;
          return id === taskId ? { ...t, isCompleted: true } : t;
        })
      );
      addToast('Task completed! Points earned 🎉', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to complete task', 'error');
    } finally {
      setCompletingTask(null);
    }
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalPoints = tasks.reduce((sum, t) => sum + (t.isCompleted ? (t.points || 0) : 0), 0);

  return (
    <div className="page client-home">
      <div className="client-greeting">
        <div className="flex gap-sm" style={{ alignItems: 'center', marginBottom: '0.25rem' }}>
          {greeting.icon}
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>
            {greeting.text}, <span className="text-accent">{user?.name?.split(' ')[0] || 'Champion'}!</span>
          </h1>
        </div>
        <p className="text-muted" style={{ fontStyle: 'italic', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
          "{quote}"
        </p>
      </div>

      <div className="client-streak" style={{ margin: '1.5rem 0' }}>
        <div className="flex gap-lg" style={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '1rem 1.5rem',
              background: 'var(--bg-secondary, #111)',
              borderRadius: 16,
              minWidth: 120,
            }}
          >
            <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>
              🔥
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning, #f59e0b)', marginTop: 4 }}>
              {user?.streak || 0}
            </div>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Day Streak</span>
          </div>
        </div>
      </div>

      <div className="grid grid-3 gap-md" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ color: 'var(--info, #3b82f6)' }}>
            <Scale size={24} />
          </div>
          <div className="stat-card-value">{user?.currentWeight || '—'}</div>
          <div className="stat-card-label">Current Weight (kg)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ color: 'var(--success, #22c55e)' }}>
            <Target size={24} />
          </div>
          <div className="stat-card-value">{user?.goalWeight || '—'}</div>
          <div className="stat-card-label">Goal Weight (kg)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ color: 'var(--accent)' }}>
            <Star size={24} />
          </div>
          <div className="stat-card-value">{user?.points || 0}</div>
          <div className="stat-card-label">Total Points</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header flex flex-between" style={{ alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            Today's Tasks
          </h2>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            {completedCount}/{tasks.length} done
          </span>
        </div>
        <div className="card-body">
          {loading ? (
            <Loader />
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={40} />
              <p className="text-muted">No tasks for today. Enjoy your rest!</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--bg-tertiary, #333)',
                  marginBottom: '1rem',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : '0%',
                    height: '100%',
                    background: 'var(--accent)',
                    borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div className="task-list">
                {tasks.map((task) => {
                  const tId = task._id || task.id;
                  return (
                    <div key={tId} className="task-item" style={{ opacity: task.isCompleted ? 0.6 : 1 }}>
                      <button
                        className="task-checkbox"
                        onClick={() => !task.isCompleted && handleCompleteTask(tId)}
                        disabled={task.isCompleted || completingTask === tId}
                        style={{
                          cursor: task.isCompleted ? 'default' : 'pointer',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          display: 'flex',
                        }}
                      >
                        {task.isCompleted ? (
                          <CheckCircle2 size={22} style={{ color: 'var(--success, #22c55e)' }} />
                        ) : completingTask === tId ? (
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              border: '2px solid var(--accent)',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }}
                          />
                        ) : (
                          <Circle size={22} style={{ color: 'var(--text-muted, #888)' }} />
                        )}
                      </button>
                      <div style={{ flex: 1 }}>
                        <span style={{ textDecoration: task.isCompleted ? 'line-through' : 'none', fontWeight: 500 }}>
                          {task.title}
                        </span>
                      </div>
                      <span
                        className="text-accent"
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: 'var(--accent-alpha, rgba(0,200,150,0.1))',
                          padding: '2px 8px',
                          borderRadius: 8,
                        }}
                      >
                        +{task.points || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-3 gap-md">
        <button
          className="card"
          onClick={() => navigate('/meals/log')}
          style={{
            cursor: 'pointer',
            border: 'none',
            textAlign: 'center',
            padding: '1.5rem',
            transition: 'transform 0.2s',
            background: 'var(--bg-secondary, #111)',
          }}
        >
          <UtensilsCrossed size={28} style={{ color: 'var(--success, #22c55e)', marginBottom: 8 }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Log Meal</p>
        </button>
        <button
          className="card"
          onClick={() => navigate('/workout')}
          style={{
            cursor: 'pointer',
            border: 'none',
            textAlign: 'center',
            padding: '1.5rem',
            transition: 'transform 0.2s',
            background: 'var(--bg-secondary, #111)',
          }}
        >
          <Dumbbell size={28} style={{ color: 'var(--accent)', marginBottom: 8 }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>View Workout</p>
        </button>
        <button
          className="card"
          onClick={() => navigate('/diet')}
          style={{
            cursor: 'pointer',
            border: 'none',
            textAlign: 'center',
            padding: '1.5rem',
            transition: 'transform 0.2s',
            background: 'var(--bg-secondary, #111)',
          }}
        >
          <Apple size={28} style={{ color: 'var(--warning, #f59e0b)', marginBottom: 8 }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>View Diet</p>
        </button>
      </div>
    </div>
  );
}
