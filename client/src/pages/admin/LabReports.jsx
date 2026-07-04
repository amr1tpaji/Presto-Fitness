import { useState, useEffect, useContext, useCallback } from 'react';
import { labsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { FlaskConical, Filter, Calendar, User } from 'lucide-react';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'normal', label: 'Normal' },
  { key: 'attention', label: 'Attention' },
  { key: 'critical', label: 'Critical' },
];

export default function LabReports() {
  const { addToast } = useContext(ToastContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const res = await labsAPI.getAll();
      setReports(res.data?.data?.labReports || []);
    } catch (err) {
      addToast('Failed to load lab reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered = filter === 'all'
    ? reports
    : reports.filter((r) => r.overallStatus === filter);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'critical': return 'danger';
      case 'attention': return 'warning';
      case 'normal': return 'success';
      default: return 'success';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'var(--danger, #ef4444)';
      case 'attention': return 'var(--warning, #f59e0b)';
      case 'normal': return 'var(--success, #22c55e)';
      default: return 'var(--success, #22c55e)';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Lab Reports</h1>
        <p className="page-subtitle">View and manage all client lab reports</p>
      </div>

      <div className="flex gap-sm" style={{ marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={16} className="text-muted" />
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.key}
            className={`tab ${filter === sf.key ? 'active' : ''}`}
            onClick={() => setFilter(sf.key)}
            style={{ borderRadius: 20, padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FlaskConical size={48} />
          <h3>No lab reports found</h3>
          <p className="text-muted">
            {filter !== 'all' ? 'No reports match this filter' : 'Lab reports will appear here once uploaded'}
          </p>
        </div>
      ) : (
        <div className="grid grid-3 gap-md">
          {filtered.map((report) => {
            const rId = report._id || report.id;
            return (
              <div
                key={rId}
                className="card"
                style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                onClick={() => setSelectedReport(report)}
              >
                <div className="card-body">
                  <div className="flex flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: `${getStatusColor(report.overallStatus)}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getStatusColor(report.overallStatus),
                      }}
                    >
                      <FlaskConical size={22} />
                    </div>
                    <Badge variant={getStatusVariant(report.overallStatus)}>
                      {report.overallStatus || 'normal'}
                    </Badge>
                  </div>
                  <div className="flex gap-sm" style={{ alignItems: 'center', marginBottom: '0.25rem' }}>
                    <User size={14} className="text-muted" />
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                      {report.clientName || report.client?.name || 'Client'}
                    </span>
                  </div>
                  <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                    <Calendar size={14} className="text-muted" />
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {new Date(report.date || report.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {report.biomarkers?.length || 0} biomarkers tested
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedReport && (
        <Modal
          onClose={() => setSelectedReport(null)}
          title={`Lab Report — ${selectedReport.clientName || selectedReport.client?.name || 'Client'}`}
        >
          <div style={{ padding: '0.5rem 0' }}>
            <div className="flex flex-between" style={{ alignItems: 'center', marginBottom: '1rem' }}>
              <span className="text-muted">
                {new Date(selectedReport.date || selectedReport.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <Badge variant={getStatusVariant(selectedReport.overallStatus)}>
                {selectedReport.overallStatus || 'normal'}
              </Badge>
            </div>

            {selectedReport.notes && (
              <div
                style={{
                  background: 'var(--bg-tertiary, #1a1a1a)',
                  borderRadius: 8,
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4 }}>Notes:</strong>
                <span className="text-muted">{selectedReport.notes}</span>
              </div>
            )}

            {selectedReport.biomarkers && selectedReport.biomarkers.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Biomarker</th>
                      <th>Value</th>
                      <th>Unit</th>
                      <th>Ref Range</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.biomarkers.map((bm, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{bm.name}</td>
                        <td style={{ fontWeight: 600 }}>{bm.value}</td>
                        <td className="text-muted">{bm.unit || '-'}</td>
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>{bm.refRange || '-'}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: getStatusColor(bm.status),
                                display: 'inline-block',
                              }}
                            />
                            {bm.status || 'normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p className="text-muted">No biomarker data available</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
