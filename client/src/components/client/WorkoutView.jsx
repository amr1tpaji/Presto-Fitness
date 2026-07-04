import Badge from '../../components/common/Badge';
import { Dumbbell, Timer, Weight, Repeat2, StickyNote } from 'lucide-react';

export default function WorkoutView({ workout }) {
  if (!workout) {
    return (
      <div className="empty-state" style={{ padding: '3rem 0' }}>
        <Dumbbell size={56} style={{ color: 'var(--text-muted, #888)' }} />
        <h3 style={{ margin: '1rem 0 0.25rem' }}>No Workout Assigned</h3>
        <p className="text-muted">Your trainer hasn't assigned a workout for this day yet.</p>
      </div>
    );
  }

  const getDifficultyVariant = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'success';
    }
  };

  const exercises = workout.exercises || [];

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="flex flex-between" style={{ alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{workout.title}</h2>
              {workout.description && (
                <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                  {workout.description}
                </p>
              )}
            </div>
            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
              <Badge variant={getDifficultyVariant(workout.difficulty)}>
                {workout.difficulty || 'Beginner'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="empty-state">
          <Dumbbell size={40} />
          <p className="text-muted">No exercises listed for this workout</p>
        </div>
      ) : (
        <div className="flex-col gap-md">
          {exercises.map((exercise, idx) => (
            <div key={idx} className="exercise-card card">
              <div className="card-body">
                <div className="flex gap-md" style={{ alignItems: 'flex-start' }}>
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
                      flexShrink: 0,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{exercise.name}</h3>
                    <div className="flex gap-md" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        className="flex gap-sm"
                        style={{
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          background: 'var(--bg-tertiary, #1a1a1a)',
                          padding: '4px 10px',
                          borderRadius: 6,
                        }}
                      >
                        <Repeat2 size={14} style={{ color: 'var(--accent)' }} />
                        <strong>{exercise.sets || 0}</strong> sets × <strong>{exercise.reps || 0}</strong> reps
                      </span>
                      {exercise.weight && (
                        <span
                          className="flex gap-sm"
                          style={{
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            background: 'var(--bg-tertiary, #1a1a1a)',
                            padding: '4px 10px',
                            borderRadius: 6,
                          }}
                        >
                          <Weight size={14} style={{ color: 'var(--info, #3b82f6)' }} />
                          {exercise.weight}
                        </span>
                      )}
                      {exercise.rest && (
                        <span
                          className="flex gap-sm"
                          style={{
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            background: 'var(--bg-tertiary, #1a1a1a)',
                            padding: '4px 10px',
                            borderRadius: 6,
                          }}
                        >
                          <Timer size={14} style={{ color: 'var(--warning, #f59e0b)' }} />
                          {exercise.rest}s rest
                        </span>
                      )}
                    </div>
                    {exercise.notes && (
                      <div
                        className="flex gap-sm"
                        style={{
                          marginTop: '0.5rem',
                          alignItems: 'flex-start',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted, #888)',
                        }}
                      >
                        <StickyNote size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                        {exercise.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
