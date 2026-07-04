import { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getImageUrl } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { Users, Search, ArrowRight, Activity, Calendar } from 'lucide-react';

export default function ClientList() {
  const { addToast } = useContext(ToastContext);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClients = useCallback(async () => {
    try {
      const res = await adminAPI.getClients({ limit: 50, search });
      setClients(res.data?.data?.clients || []);
    } catch (err) {
      addToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, fetchClients]);

  return (
    <div className="page">
      <div className="page-header flex flex-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage and monitor all your fitness clients</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />
      </div>

      {loading && clients.length === 0 ? (
        <Loader />
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No clients found</h3>
          <p className="text-muted">{search ? 'Try a different search term' : 'Your client list is empty.'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact Info</th>
                  <th>Weight (kg)</th>
                  <th>Streak</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const cId = client._id || client.id;
                  return (
                    <tr key={cId}>
                      <td>
                        <Link
                          to={`/admin/clients/${cId}`}
                          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}
                        >
                          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--bg-primary, #000)',
                                fontWeight: 700,
                              }}
                            >
                              {client.avatar ? (
                                <img 
                                  src={getImageUrl(client.avatar)} 
                                  alt="Avatar" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                                />
                              ) : (
                                (client.name || 'U')[0].toUpperCase()
                              )}
                            </div>
                            <div>
                              <div>{client.name || 'Unknown'}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                Joined {new Date(client.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>{client.phone}</div>
                        {client.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{client.email}</div>}
                      </td>
                      <td>
                        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                          <Activity size={16} className="text-muted" />
                          {client.currentWeight || '-'}
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--warning, #f59e0b)' }}>
                          🔥 {client.rewards?.streak || client.streak || 0}
                        </span>
                      </td>
                      <td>
                        {client.isPhoneVerified ? (
                          <Badge variant={client.subscription?.status === 'active' ? 'success' : 'warning'}>
                            {client.subscription?.status || 'inactive'}
                          </Badge>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Badge variant="danger">Pending</Badge>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>Key: {client.activationKey}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/admin/clients/${cId}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                          View <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
