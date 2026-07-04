import { useState, useEffect, useContext, useCallback } from 'react';
import { workoutsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import WorkoutBuilder from '../../components/admin/WorkoutBuilder';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Dumbbell, Plus, Search, Edit2, Trash2, Calendar, BarChart3 } from 'lucide-react';

export default function Workouts() {
  const { addToast } = useContext(ToastContext);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [deleting, setDeleting] = useState(null);

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

  const handleCreate = () => {
    setEditingWorkout(null);
    setShowModal(true);
  };

  const handleEdit = (workout) => {
    setEditingWorkout(workout);
    setShowModal(true);
  };

  const handleDelete = async (workoutId) => {
    setDeleting(workoutId);
    try {
      await workoutsAPI.delete(workoutId);
      addToast('Workout deleted successfully', 'success');
      setWorkouts((prev) => prev.filter((w) => (w._id || w.id) !== workoutId));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete workout', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingWorkout(null);
    fetchWorkouts();
    addToast(editingWorkout ? 'Workout updated!' : 'Workout created!', 'success');
  };

  const filtered = workouts.filter(
    (w) =>
      w.title?.toLowerCase().includes(search.toLowerCase()) ||
      w.day?.toLowerCase().includes(search.toLowerCase())
  );

  const getDifficultyVariant = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'success';
    }
  };

  return (
    <div className="page">
      <div className="page-header flex flex-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Workouts</h1>
          <p className="page-subtitle">Manage workout plans for your clients</p>
        </div>
        <Button variant="primary" onClick={handleCreate} icon={<Plus size={18} />}>
          Create Workout
        </Button>
      </div>

      <div style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
        <Input
          placeholder="Search workouts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Dumbbell size={48} />
          <h3>No workouts found</h3>
          <p className="text-muted">
            {search ? 'Try a different search term' : 'Create your first workout plan'}
          </p>
          {!search && (
            <Button variant="primary" onClick={handleCreate} icon={<Plus size={18} />}>
              Create Workout
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-3 gap-md">
          {filtered.map((workout) => {
            const wId = workout._id || workout.id;
            const exerciseCount = workout.exercises?.length || 0;
            return (
              <div key={wId} className="card" style={{ position: 'relative' }}>
                <div className="card-body">
                  <div className="flex flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: 'var(--accent-alpha, rgba(0,200,150,0.12))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                      }}
                    >
                      <Dumbbell size={22} />
                    </div>
                    <Badge variant={getDifficultyVariant(workout.difficulty)}>
                      {workout.difficulty || 'Beginner'}
                    </Badge>
                  </div>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem' }}>{workout.title}</h3>
                  {workout.description && (
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                      {workout.description.length > 80 ? workout.description.slice(0, 80) + '…' : workout.description}
                    </p>
                  )}
                  <div className="flex gap-md" style={{ marginBottom: '1rem' }}>
                    <span className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} /> {workout.day || 'Any'}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BarChart3 size={14} /> {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="divider" />
                  <div className="flex gap-sm" style={{ marginTop: '0.75rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(workout)} icon={<Edit2 size={14} />}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(wId)}
                      loading={deleting === wId}
                      style={{ color: 'var(--danger, #ef4444)' }}
                      icon={<Trash2 size={14} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingWorkout(null); }} title={editingWorkout ? 'Edit Workout' : 'Create Workout'} large>
          <WorkoutBuilder workout={editingWorkout} onSave={handleSave} />
        </Modal>
      )}
    </div>
  );
}
