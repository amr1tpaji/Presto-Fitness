import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Search, Users, ChevronRight, Flame } from 'lucide-react';
import Badge from '../common/Badge';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await adminAPI.getClients();
      setClients(data.clients || []);
    } catch (err) {
      addToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="shimmer-lines">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="shimmer-line" style={{ height: '48px', marginBottom: '8px', background: 'var(--bg-elevated)', borderRadius: '8px', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>All Clients</h3>
        <div className="form-input-wrapper" style={{ width: '260px' }}>
          <Search size={18} className="form-input-icon" />
          <input
            className="form-input has-icon"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="empty-state-icon" />
          <h3>No clients found</h3>
          <p>{search ? 'Try a different search term' : 'Clients will appear here once they register'}</p>
        </div>
      ) : (
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Weight</th>
                <th>Streak</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client._id}
                  className="clickable"
                  onClick={() => navigate(`/admin/clients/${client._id}`)}
                >
                  <td>
                    <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--accent-subtle)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.85rem'
                      }}>
                        {client.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span>{client.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{client.phone}</td>
                  <td>
                    <Badge variant={
                      client.subscription?.status === 'active' ? 'success' :
                      client.subscription?.status === 'expired' ? 'danger' : 'default'
                    }>
                      {client.subscription?.status || 'No Plan'}
                    </Badge>
                  </td>
                  <td>{client.currentWeight ? `${client.currentWeight} kg` : '—'}</td>
                  <td>
                    <div className="flex" style={{ alignItems: 'center', gap: '4px' }}>
                      {client.rewards?.streak > 0 && <Flame size={14} style={{ color: '#f59e0b' }} />}
                      <span>{client.rewards?.streak || 0}</span>
                    </div>
                  </td>
                  <td>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
