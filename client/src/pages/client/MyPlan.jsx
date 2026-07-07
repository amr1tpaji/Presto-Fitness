import { useAuth } from '../../hooks/useAuth';
import { getImageUrl } from '../../services/api';
import { FileText } from 'lucide-react';
import '../../styles/client.css';

export default function MyPlan() {
  const { user } = useAuth();

  return (
    <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={28} /> My Plan
        </h1>
        <p className="page-subtitle">Your comprehensive workout and diet plan</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {user?.planPdf ? (
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-header flex flex-between" style={{ alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Plan Preview</h3>
              <a href={getImageUrl(user.planPdf)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
                Open in new tab
              </a>
            </div>
            <div className="card-body" style={{ padding: 0, flex: 1 }}>
              <object 
                data={getImageUrl(user.planPdf)} 
                type="application/pdf" 
                width="100%" 
                height="100%"
                style={{ display: 'block', border: 'none' }}
              >
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>PDF preview not available in this browser.</p>
                  <a href={getImageUrl(user.planPdf)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Download PDF</a>
                </div>
              </object>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: '2rem' }}>
            <FileText size={48} />
            <h3>No plan assigned yet</h3>
            <p className="text-muted">Your trainer hasn't uploaded your plan yet. Please check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}
