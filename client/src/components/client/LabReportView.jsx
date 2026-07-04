import { useState } from 'react';
import Badge from '../../components/common/Badge';
import { FlaskConical, ChevronDown, ChevronUp, Calendar, MessageSquare } from 'lucide-react';

export default function LabReportView({ reports }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!reports || reports.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem 0' }}>
        <FlaskConical size={48} style={{ color: 'var(--text-muted, #888)' }} />
        <h3 style={{ margin: '0.75rem 0 0.25rem' }}>No Lab Reports</h3>
        <p className="text-muted">Your lab reports will appear here once uploaded by your trainer.</p>
      </div>
    );
  }

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

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-col gap-md">
      {reports.map((report, idx) => {
        const rId = report._id || report.id || idx;
        const isExpanded = expandedId === rId;
        const biomarkers = report.biomarkers || [];

        return (
          <div
            key={rId}
            className="card"
            style={{
              border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border, #333)'}`,
              transition: 'border-color 0.2s',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => toggleExpand(rId)}
              className="flex flex-between"
              style={{
                width: '100%',
                padding: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                alignItems: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <div className="flex gap-md" style={{ alignItems: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${getStatusColor(report.overallStatus)}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: getStatusColor(report.overallStatus),
                    flexShrink: 0,
                  }}
                >
                  <FlaskConical size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                    <Calendar size={13} className="text-muted" />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {new Date(report.date || report.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {biomarkers.length} biomarker{biomarkers.length !== 1 ? 's' : ''} tested
                  </span>
                </div>
              </div>
              <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                <Badge variant={getStatusVariant(report.overallStatus)}>
                  {report.overallStatus || 'normal'}
                </Badge>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {isExpanded && (
              <div style={{ padding: '0 1rem 1rem' }}>
                <div className="divider" style={{ margin: '0 0 1rem' }} />

                {report.notes && (
                  <div
                    style={{
                      background: 'var(--bg-tertiary, #1a1a1a)',
                      borderRadius: 8,
                      padding: '0.75rem 1rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}
                  >
                    <MessageSquare size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: 2 }}>
                        Trainer Notes
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>{report.notes}</span>
                    </div>
                  </div>
                )}

                {biomarkers.length > 0 ? (
                  <div className="flex-col gap-sm">
                    {biomarkers.map((bm, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex flex-between"
                        style={{
                          padding: '0.5rem 0',
                          borderBottom: bIdx < biomarkers.length - 1 ? '1px solid var(--border, #333)' : 'none',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{bm.name}</span>
                          {bm.category && (
                            <span className="text-muted" style={{ marginLeft: 6, fontSize: '0.7rem' }}>
                              ({bm.category})
                            </span>
                          )}
                        </div>
                        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {bm.value} <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.8rem' }}>{bm.unit}</span>
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: getStatusColor(bm.status),
                              background: `${getStatusColor(bm.status)}15`,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: getStatusColor(bm.status),
                                display: 'inline-block',
                              }}
                            />
                            {bm.status || 'normal'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '1rem 0' }}>
                    No biomarker details available
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
