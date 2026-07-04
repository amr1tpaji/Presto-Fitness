import { useState, useEffect, useContext, useCallback } from 'react';
import { weightAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import WeightChart from '../../components/admin/WeightChart';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { Scale, Plus, Target, TrendingDown, TrendingUp } from 'lucide-react';

export default function ProgressTracker() {
  const { user } = useAuth();
  const { addToast } = useContext(ToastContext);
  const [weightLog, setWeightLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWeights = useCallback(async () => {
    try {
      const res = await weightAPI.getHistory();
      setWeightLog(res.data?.weights || res.data || []);
    } catch (err) {
      addToast('Failed to load weight history', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchWeights();
  }, [fetchWeights]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w < 20 || w > 300) {
      addToast('Enter a valid weight (20-300 kg)', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await weightAPI.log({ weight: w, note: note.trim() || undefined });
      addToast('Weight logged!', 'success');
      setWeight('');
      setNote('');
      fetchWeights();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to log weight', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  const chartData = weightLog
    .map((w) => ({ date: w.date || w.createdAt, weight: w.weight }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const latestWeight = weightLog.length > 0
    ? [...weightLog].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0]?.weight
    : null;
  const goalWeight = user?.goalWeight;
  const diff = latestWeight && goalWeight ? (latestWeight - goalWeight).toFixed(1) : null;

  return (
    <div className="flex-col gap-lg">
      {latestWeight && goalWeight && (
        <div className="card">
          <div className="card-body">
            <div className="grid grid-3 gap-md" style={{ textAlign: 'center' }}>
              <div>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Current</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {latestWeight}
                  <span style={{ fontSize: '0.9rem', fontWeight: 400 }}> kg</span>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Number(diff) > 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <TrendingDown size={20} style={{ color: 'var(--warning, #f59e0b)' }} />
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--warning, #f59e0b)', fontWeight: 600 }}>
                      {diff} kg to go
                    </p>
                  </div>
                ) : Number(diff) < 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <TrendingUp size={20} style={{ color: 'var(--success, #22c55e)' }} />
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--success, #22c55e)', fontWeight: 600 }}>
                      {Math.abs(diff)} kg gained
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <Target size={20} style={{ color: 'var(--accent)' }} />
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                      Goal reached! 🎉
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Goal</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {goalWeight}
                  <span style={{ fontSize: '0.9rem', fontWeight: 400 }}> kg</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Weight Trend</h3>
          </div>
          <div className="card-body">
            <WeightChart data={chartData} goalWeight={goalWeight} />
          </div>
        </div>
      )}

      <div className="grid grid-2 gap-lg" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} /> Log Weight
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="flex-col gap-md">
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  placeholder="e.g. 75.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  icon={<Scale size={18} />}
                  required
                />
                <div className="form-group">
                  <label className="form-label">Note (optional)</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Any notes..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="primary" loading={submitting} icon={<Plus size={16} />}>
                  Log Weight
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Entries</h3>
          </div>
          <div className="card-body">
            {weightLog.length === 0 ? (
              <div className="empty-state">
                <Scale size={32} />
                <p className="text-muted">No entries yet</p>
              </div>
            ) : (
              <div className="flex-col gap-sm" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {[...weightLog]
                  .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
                  .slice(0, 10)
                  .map((entry, idx) => (
                    <div
                      key={entry._id || idx}
                      className="flex flex-between"
                      style={{
                        padding: '0.5rem 0',
                        borderBottom: '1px solid var(--border, #333)',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{entry.weight} kg</span>
                        {entry.note && (
                          <p className="text-muted" style={{ fontSize: '0.75rem', margin: '2px 0 0' }}>{entry.note}</p>
                        )}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(entry.date || entry.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
