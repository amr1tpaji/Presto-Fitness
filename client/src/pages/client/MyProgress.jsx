import { useState, useEffect, useContext, useCallback } from 'react';
import { weightAPI, labsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import WeightChart from '../../components/admin/WeightChart';
import LabReportView from '../../components/client/LabReportView';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Scale, TrendingUp, Plus, FileText, Calendar } from 'lucide-react';

export default function MyProgress() {
  const { user } = useAuth();
  const { addToast } = useContext(ToastContext);
  const [weightLog, setWeightLog] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [weightRes, labRes] = await Promise.all([
        weightAPI.getHistory(),
        labsAPI.getAll(),
      ]);
      setWeightLog(weightRes.data?.data?.weightLogs || []);
      setLabReports(labRes.data?.data?.labReports || []);
    } catch (err) {
      addToast('Failed to load progress data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogWeight = async (e) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w < 20 || w > 300) {
      addToast('Please enter a valid weight (20-300 kg)', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await weightAPI.log({ weight: w, note: note.trim() || undefined });
      addToast('Weight logged successfully!', 'success');
      setWeight('');
      setNote('');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to log weight', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><Loader /></div>;

  const chartData = weightLog
    .map((w) => ({
      date: w.date || w.createdAt,
      weight: w.weight,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={28} /> My Progress
        </h1>
        <p className="page-subtitle">Track your weight and health metrics</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scale size={20} /> Weight Progress
          </h2>
        </div>
        <div className="card-body">
          {chartData.length > 1 ? (
            <WeightChart data={chartData} goalWeight={user?.goalWeight} />
          ) : (
            <div className="empty-state" style={{ padding: '2rem 0' }}>
              <Scale size={40} />
              <p className="text-muted">Log at least 2 weights to see your chart</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2 gap-lg" style={{ alignItems: 'start', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} /> Log Weight
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleLogWeight}>
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
                  <textarea
                    className="form-textarea"
                    placeholder="How are you feeling today?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button type="submit" variant="primary" loading={submitting} icon={<Plus size={18} />}>
                  Log Weight
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} /> Weight History
            </h3>
          </div>
          <div className="card-body">
            {weightLog.length === 0 ? (
              <div className="empty-state">
                <Scale size={32} />
                <p className="text-muted">No weight entries yet</p>
              </div>
            ) : (
              <div className="flex-col gap-sm" style={{ maxHeight: 350, overflowY: 'auto' }}>
                {weightLog
                  .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
                  .map((entry, idx) => (
                    <div
                      key={entry._id || idx}
                      className="flex flex-between"
                      style={{
                        padding: '0.6rem 0',
                        borderBottom: '1px solid var(--border, #333)',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{entry.weight} kg</span>
                        {entry.note && (
                          <p className="text-muted" style={{ fontSize: '0.8rem', margin: '2px 0 0' }}>
                            {entry.note}
                          </p>
                        )}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
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

      <div className="card">
        <div className="card-header">
          <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} /> Lab Reports
          </h2>
        </div>
        <div className="card-body">
          <LabReportView reports={labReports} />
        </div>
      </div>
    </div>
  );
}
