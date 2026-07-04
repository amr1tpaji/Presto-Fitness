import { useState, useContext } from 'react';
import { workoutsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Button from '../common/Button';
import { Plus, Trash2, Save, Dumbbell } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const emptyExercise = { name: '', sets: 3, reps: '12', weight: '', restTime: '60s', notes: '' };

export default function WorkoutBuilder({ workout = null, clientId, onSave }) {
  const [title, setTitle] = useState(workout?.title || '');
  const [description, setDescription] = useState(workout?.description || '');
  const [day, setDay] = useState(workout?.day || 'Monday');
  const [difficulty, setDifficulty] = useState(workout?.difficulty || 'beginner');
  const [exercises, setExercises] = useState(
    workout?.exercises?.length ? workout.exercises : [{ ...emptyExercise }]
  );
  const [saving, setSaving] = useState(false);
  const { addToast } = useContext(ToastContext);

  const addExercise = () => {
    setExercises([...exercises, { ...emptyExercise }]);
  };

  const removeExercise = (index) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please enter a workout title', 'error');
      return;
    }
    if (exercises.some(ex => !ex.name.trim())) {
      addToast('Please name all exercises', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title, description, day, difficulty, exercises,
        ...(clientId && { assignedTo: [clientId] }),
      };

      if (workout?._id) {
        await workoutsAPI.update(workout._id, payload);
        addToast('Workout updated!', 'success');
      } else {
        await workoutsAPI.create(payload);
        addToast('Workout created!', 'success');
      }
      onSave?.();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save workout', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-2" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">Workout Title *</label>
          <input className="form-input" placeholder="e.g. Push Day" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="Brief description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="form-group">
          <label className="form-label">Day</label>
          <select className="form-select" value={day} onChange={(e) => setDay(e.target.value)}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Difficulty</label>
          <select className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-between" style={{ marginBottom: '16px' }}>
        <h4 className="flex" style={{ alignItems: 'center', gap: '8px' }}>
          <Dumbbell size={18} style={{ color: 'var(--accent)' }} /> Exercises
        </h4>
        <Button type="button" variant="ghost" size="sm" icon={<Plus size={16} />} onClick={addExercise}>
          Add Exercise
        </Button>
      </div>

      <div className="flex-col gap-md">
        {exercises.map((ex, i) => (
          <div key={i} className="card" style={{ background: 'var(--bg-secondary)' }}>
            <div className="card-body" style={{ padding: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <span className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  EXERCISE {i + 1}
                </span>
                {exercises.length > 1 && (
                  <button type="button" onClick={() => removeExercise(i)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <input className="form-input" placeholder="Exercise name *" value={ex.name} onChange={(e) => updateExercise(i, 'name', e.target.value)} />
              </div>
              <div className="grid grid-4" style={{ gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Sets</label>
                  <input className="form-input" type="number" min="1" value={ex.sets} onChange={(e) => updateExercise(i, 'sets', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Reps</label>
                  <input className="form-input" placeholder="12" value={ex.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Weight</label>
                  <input className="form-input" placeholder="20kg" value={ex.weight} onChange={(e) => updateExercise(i, 'weight', e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Rest</label>
                  <input className="form-input" placeholder="60s" value={ex.restTime} onChange={(e) => updateExercise(i, 'restTime', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                <input className="form-input" placeholder="Notes (optional)" value={ex.notes} onChange={(e) => updateExercise(i, 'notes', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        <Button type="submit" variant="primary" loading={saving} icon={<Save size={18} />} fullWidth>
          {workout?._id ? 'Update Workout' : 'Create Workout'}
        </Button>
      </div>
    </form>
  );
}
