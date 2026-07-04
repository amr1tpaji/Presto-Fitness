import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { workoutsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import WorkoutView from '../../components/client/WorkoutView';
import Loader from '../../components/common/Loader';
import { Dumbbell } from 'lucide-react';
import '../../styles/client.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MyWorkout() {
  const { addToast } = useContext(ToastContext);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });

  const fetchWorkouts = useCallback(async () => {
    try {
      const res = await workoutsAPI.getAll();
      setWorkouts(res.data?.data?.workouts || []);
    } catch (err) {
      addToast('Failed to load workouts', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const todayWorkout = useMemo(() => {
    const dayName = DAYS[selectedDay];
    return workouts.find(
      (w) => w.day?.toLowerCase() === dayName.toLowerCase()
    ) || null;
  }, [workouts, selectedDay]);

  if (loading) return <div className="page"><Loader /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Dumbbell size={28} /> My Workout
        </h1>
        <p className="page-subtitle">Follow your personalized workout plan</p>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
        {DAY_SHORT.map((day, idx) => (
          <button
            key={day}
            className={`tab ${selectedDay === idx ? 'active' : ''}`}
            onClick={() => setSelectedDay(idx)}
            style={{
              minWidth: 56,
              position: 'relative',
            }}
          >
            {day}
            {idx === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                }}
              />
            )}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
          {DAYS[selectedDay]}
        </h2>
        <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
          {todayWorkout ? todayWorkout.title : 'No workout scheduled'}
        </p>
      </div>

      <WorkoutView workout={todayWorkout} />
    </div>
  );
}
