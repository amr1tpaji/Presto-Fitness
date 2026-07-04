import { useState, useEffect, useContext } from 'react';
import { tasksAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Plus, CheckCircle2, Circle, Zap, Send } from 'lucide-react';

const TEMPLATES = [
  { type: 'workout', title: 'Complete Workout', description: 'Finish today\'s assigned workout', points: 25 },
  { type: 'meal', title: 'Log All Meals', description: 'Log breakfast, lunch, and dinner', points: 20 },
  { type: 'water', title: 'Drink 3L Water', description: 'Stay hydrated throughout the day', points: 15 },
  { type: 'sleep', title: 'Sleep 8 Hours', description: 'Get adequate rest for recovery', points: 15 },
  { type: 'supplement', title: 'Take Supplements', description: 'Take all prescribed supplements', points: 10 },
];

export default function TaskManager({ clientId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customTask, setCustomTask] = useState({ type: 'custom', title: '', description: '', points: 10 });
  const [sending, setSending] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
    if (clientId) fetchTasks();
  }, [clientId]);

  const fetchTasks = async () => {
    try {
      const { data } = await tasksAPI.getClientTasks(clientId);
      setTasks(data.tasks || []);
    } catch {
      // May not have tasks yet
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = (index) => {
    setSelectedTemplates(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleAssignTasks = async () => {
    const taskList = [
      ...selectedTemplates.map(i => TEMPLATES[i]),
      ...(customTask.title ? [customTask] : []),
    ];
    if (taskList.length === 0) { addToast('Select or create at least one task', 'error'); return; }

    setSending(true);
    try {
      await tasksAPI.create({
        userId: clientId,
        date: new Date().toISOString(),
        tasks: taskList,
      });
      addToast('Tasks assigned!', 'success');
      setSelectedTemplates([]);
      setCustomTask({ type: 'custom', title: '', description: '', points: 10 });
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to assign tasks', 'error');
    } finally {
      setSending(false);
    }
  };

  const completedCount = tasks.flatMap(t => t.tasks || []).filter(t => t.isCompleted).length;
  const totalCount = tasks.flatMap(t => t.tasks || []).length;
  const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Completion Rate */}
      {totalCount > 0 && (
        <div className="card" style={{ background: 'var(--bg-secondary)', marginBottom: '20px' }}>
          <div className="card-body" style={{ padding: '16px' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Task Completion Rate</span>
              <span style={{ fontWeight: 700, color: rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                {rate}%
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${rate}%`, height: '100%', background: rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '6px' }}>{completedCount} of {totalCount} tasks completed</p>
          </div>
        </div>
      )}

      {/* Quick-Add Templates */}
      <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={16} style={{ color: 'var(--accent)' }} /> Quick-Add Templates
      </h4>
      <div className="flex-col gap-sm" style={{ marginBottom: '20px' }}>
        {TEMPLATES.map((t, i) => (
          <div
            key={i}
            className="card"
            style={{
              background: selectedTemplates.includes(i) ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              borderColor: selectedTemplates.includes(i) ? 'var(--accent)' : 'var(--border)',
              cursor: 'pointer',
            }}
            onClick={() => toggleTemplate(i)}
          >
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div className="flex-between">
                <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                  {selectedTemplates.includes(i) ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Circle size={18} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{t.description}</div>
                  </div>
                </div>
                <Badge variant="info" size="sm">{t.points} pts</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Task */}
      <h4 style={{ marginBottom: '12px' }}>Custom Task</h4>
      <div className="card" style={{ background: 'var(--bg-secondary)', marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div className="grid grid-2" style={{ marginBottom: '12px' }}>
            <input className="form-input" placeholder="Task title" value={customTask.title} onChange={(e) => setCustomTask({ ...customTask, title: e.target.value })} />
            <input className="form-input" type="number" min="5" max="100" placeholder="Points" value={customTask.points} onChange={(e) => setCustomTask({ ...customTask, points: parseInt(e.target.value) || 10 })} />
          </div>
          <input className="form-input" placeholder="Description (optional)" value={customTask.description} onChange={(e) => setCustomTask({ ...customTask, description: e.target.value })} />
        </div>
      </div>

      <Button variant="primary" icon={<Send size={18} />} onClick={handleAssignTasks} loading={sending} fullWidth>
        Assign Tasks for Today
      </Button>

      {/* Recent Task History */}
      {tasks.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Recent Tasks</h4>
          {tasks.slice(0, 5).map((dayTasks, i) => (
            <div key={i} className="card" style={{ background: 'var(--bg-secondary)', marginBottom: '8px' }}>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                  {new Date(dayTasks.date).toLocaleDateString()}
                </div>
                {dayTasks.tasks?.map((task, j) => (
                  <div key={j} className="flex-between" style={{ padding: '4px 0' }}>
                    <div className="flex" style={{ alignItems: 'center', gap: '8px' }}>
                      {task.isCompleted ? (
                        <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                      ) : (
                        <Circle size={14} style={{ color: 'var(--text-muted)' }} />
                      )}
                      <span style={{ fontSize: '0.85rem' }}>{task.title}</span>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{task.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
