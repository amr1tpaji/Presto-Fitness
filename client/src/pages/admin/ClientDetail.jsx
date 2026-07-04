import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import WorkoutBuilder from '../../components/admin/WorkoutBuilder';
import DietPlanBuilder from '../../components/admin/DietPlanBuilder';
import LabReportUploader from '../../components/admin/LabReportUploader';
import TaskManager from '../../components/admin/TaskManager';
import RewardManager from '../../components/admin/RewardManager';
import WeightChart from '../../components/admin/WeightChart';
import MealLogViewer from '../../components/admin/MealLogViewer';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import {
  ArrowLeft, User, Phone, Crown, Flame, Star,
  Activity, Dumbbell, UtensilsCrossed, FlaskConical,
  ListChecks, CreditCard, CheckCircle2, XCircle, Trash2,
} from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: <Activity size={16} /> },
  { key: 'workout', label: 'Workout', icon: <Dumbbell size={16} /> },
  { key: 'diet', label: 'Diet', icon: <UtensilsCrossed size={16} /> },
  { key: 'meals', label: 'Meals', icon: <UtensilsCrossed size={16} /> },
  { key: 'labs', label: 'Labs', icon: <FlaskConical size={16} /> },
  { key: 'tasks', label: 'Tasks', icon: <ListChecks size={16} /> },
  { key: 'payments', label: 'Payments', icon: <CreditCard size={16} /> },
];

export default function ClientDetail() {
  const { id } = useParams();
  const { addToast } = useContext(ToastContext);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [labReports, setLabReports] = useState([]);
  const [payments, setPayments] = useState([]);
  const navigate = useNavigate();

  const fetchClient = useCallback(async () => {
    try {
      const res = await adminAPI.getClient(id);
      const payload = res.data?.data;
      if (payload) {
        setClient({
          ...payload.client,
          weightLog: payload.recentWeightLogs || [],
          workout: payload.currentWorkout,
          dietPlan: payload.currentDiet,
        });
      }
      setLabReports(payload?.labReports || payload?.client?.labReports || []);
      setPayments(payload?.payments || payload?.client?.payments || []);
    } catch (err) {
      addToast('Failed to load client details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleLabUpload = () => {
    fetchClient();
    addToast('Lab report uploaded successfully', 'success');
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to completely delete ${client.name}'s account and ALL their data? This cannot be undone.`)) {
      try {
        await adminAPI.deleteClient(id);
        addToast('Client successfully deleted.', 'success');
        navigate('/admin/clients');
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to delete client', 'error');
      }
    }
  };

  if (loading) return <div className="page"><Loader /></div>;

  if (!client) {
    return (
      <div className="page">
        <div className="empty-state">
          <User size={48} />
          <p>Client not found</p>
          <Link to="/admin/clients" className="btn btn-primary">Back to Clients</Link>
        </div>
      </div>
    );
  }

  const recentTasks = client.tasks || [];
  const completedTasks = recentTasks.filter((t) => t.completed);
  const completionRate = recentTasks.length > 0 ? Math.round((completedTasks.length / recentTasks.length) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/admin/clients" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Clients
        </Link>
        <button className="btn btn-sm" onClick={handleDelete} style={{ background: 'var(--danger, #ef4444)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trash2 size={16} /> Delete Account
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div className="flex gap-lg" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: 'var(--bg-primary, #000)',
                flexShrink: 0,
              }}
            >
              {client.avatar ? (
                <img 
                  src={`/uploads/${client.avatar}`} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                />
              ) : (
                (client.name || 'U')[0].toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{client.name}</h1>
              <p className="text-muted" style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} /> {client.phone}
              </p>
            </div>
            <div className="flex gap-lg" style={{ flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <Badge variant={client.subscription?.status === 'active' ? 'success' : 'warning'}>
                  <Crown size={12} /> {client.subscription?.status || 'inactive'}
                </Badge>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={20} style={{ color: 'var(--warning, #f59e0b)' }} /> {client.streak || 0}
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Day Streak</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={20} style={{ color: 'var(--accent)' }} /> {client.points || 0}
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="flex-col gap-lg">
          <div className="grid grid-2 gap-md">
            <div className="card">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Weight Progress</h3>
              </div>
              <div className="card-body">
                {client.weightLog && client.weightLog.length > 0 ? (
                  <WeightChart data={client.weightLog} goalWeight={client.goalWeight} />
                ) : (
                  <div className="empty-state">
                    <Activity size={32} />
                    <p className="text-muted">No weight data logged yet</p>
                  </div>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Tasks</h3>
              </div>
              <div className="card-body">
                {recentTasks.length === 0 ? (
                  <div className="empty-state">
                    <ListChecks size={32} />
                    <p className="text-muted">No tasks assigned yet</p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          background: 'var(--bg-tertiary, #333)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${completionRate}%`,
                            height: '100%',
                            background: 'var(--accent)',
                            borderRadius: 4,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                      <span className="text-accent" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {completionRate}%
                      </span>
                    </div>
                    <div className="flex-col gap-sm">
                      {recentTasks.slice(0, 5).map((task, idx) => (
                        <div
                          key={task._id || idx}
                          className="flex gap-sm"
                          style={{ alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border, #333)' }}
                        >
                          {task.completed ? (
                            <CheckCircle2 size={18} style={{ color: 'var(--success, #22c55e)', flexShrink: 0 }} />
                          ) : (
                            <XCircle size={18} style={{ color: 'var(--text-muted, #888)', flexShrink: 0 }} />
                          )}
                          <span style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }}>
                            {task.title}
                          </span>
                          <span className="text-accent" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            +{task.points || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workout' && (
        <WorkoutBuilder
          workout={client.workout || null}
          clientId={id}
          onSave={() => {
            fetchClient();
            addToast('Workout saved successfully', 'success');
          }}
        />
      )}

      {activeTab === 'diet' && (
        <DietPlanBuilder
          dietPlan={client.dietPlan || null}
          clientId={id}
          onSave={() => {
            fetchClient();
            addToast('Diet plan saved successfully', 'success');
          }}
        />
      )}

      {activeTab === 'meals' && <MealLogViewer clientId={id} />}

      {activeTab === 'labs' && (
        <div className="flex-col gap-lg">
          <LabReportUploader clientId={id} onUpload={handleLabUpload} />
          {labReports.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Existing Reports</h3>
              </div>
              <div className="card-body">
                <div className="flex-col gap-sm">
                  {labReports.map((report, idx) => (
                    <div
                      key={report._id || idx}
                      className="card"
                      style={{
                        background: 'var(--bg-tertiary, #1a1a1a)',
                        padding: '1rem',
                      }}
                    >
                      <div className="flex flex-between" style={{ alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>
                            {new Date(report.date || report.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                            {report.biomarkers?.length || 0} biomarkers
                          </p>
                        </div>
                        <Badge
                          variant={
                            report.overallStatus === 'critical'
                              ? 'danger'
                              : report.overallStatus === 'attention'
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {report.overallStatus || 'normal'}
                        </Badge>
                      </div>
                      {report.biomarkers && report.biomarkers.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div className="divider" />
                          <div className="flex-col gap-sm" style={{ marginTop: '0.5rem' }}>
                            {report.biomarkers.map((bm, bIdx) => (
                              <div key={bIdx} className="flex flex-between" style={{ fontSize: '0.85rem' }}>
                                <span>{bm.name}</span>
                                <span style={{ fontWeight: 600 }}>
                                  {bm.value} {bm.unit}
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      color:
                                        bm.status === 'critical'
                                          ? 'var(--danger, #ef4444)'
                                          : bm.status === 'attention'
                                            ? 'var(--warning, #f59e0b)'
                                            : 'var(--success, #22c55e)',
                                    }}
                                  >
                                    ● {bm.status || 'normal'}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && <TaskManager clientId={id} />}

      {activeTab === 'payments' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Payment History</h3>
          </div>
          <div className="card-body">
            {payments.length === 0 ? (
              <div className="empty-state">
                <CreditCard size={48} />
                <p>No payment records yet</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, idx) => (
                      <tr key={payment._id || idx}>
                        <td>
                          {new Date(payment.date || payment.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td style={{ fontWeight: 600 }}>₹{payment.amount?.toLocaleString('en-IN')}</td>
                        <td>{payment.plan || '-'}</td>
                        <td>
                          <Badge variant={payment.status === 'completed' || payment.status === 'paid' ? 'success' : 'warning'}>
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="text-muted">{payment.method || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
