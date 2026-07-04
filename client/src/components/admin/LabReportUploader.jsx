import { useState, useContext, useRef } from 'react';
import { labsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { BIOMARKER_CATEGORIES } from '../../utils/constants';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Upload, FileText, ChevronDown, ChevronUp, Send } from 'lucide-react';

export default function LabReportUploader({ clientId, onUpload }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [biomarkers, setBiomarkers] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const { addToast } = useContext(ToastContext);

  const handleFile = (f) => {
    if (!f) return;
    const valid = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!valid.includes(f.type)) {
      addToast('Please upload a PDF or image file', 'error');
      return;
    }
    setFile(f);
  };

  const toggleBiomarker = (name, unit, category) => {
    const exists = biomarkers.find(b => b.name === name);
    if (exists) {
      setBiomarkers(biomarkers.filter(b => b.name !== name));
    } else {
      setBiomarkers([...biomarkers, { name, value: '', unit, category }]);
    }
  };

  const updateBiomarkerValue = (name, value) => {
    setBiomarkers(biomarkers.map(b => b.name === name ? { ...b, value: parseFloat(value) || '' } : b));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date) { addToast('Please enter title and date', 'error'); return; }

    const activeBiomarkers = biomarkers.filter(b => b.value !== '' && b.value !== 0);
    if (activeBiomarkers.length === 0) { addToast('Please enter at least one biomarker value', 'error'); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('title', title);
      formData.append('date', date);
      formData.append('userId', clientId);
      formData.append('biomarkers', JSON.stringify(activeBiomarkers));

      const { data } = await labsAPI.upload(formData);
      setResults(data.report);
      addToast('Lab report uploaded and evaluated!', 'success');
      onUpload?.();
    } catch (err) {
      addToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const statusColor = (status) => {
    if (status === 'normal') return 'success';
    if (status === 'high' || status === 'low') return 'warning';
    return 'danger';
  };

  return (
    <div>
      {/* Results Display */}
      {results && (
        <div className="card" style={{ marginBottom: '24px', borderColor: results.overallStatus === 'normal' ? 'var(--success)' : results.overallStatus === 'attention' ? 'var(--warning)' : 'var(--danger)' }}>
          <div className="card-header">
            <h4>Evaluation Results</h4>
            <Badge variant={statusColor(results.overallStatus)}>{results.overallStatus?.toUpperCase()}</Badge>
          </div>
          <div className="card-body">
            <div className="flex-col gap-sm">
              {results.biomarkers?.map((b, i) => (
                <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{b.name}</span>
                  <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 600 }}>{b.value} {b.unit}</span>
                    <Badge variant={statusColor(b.status)} size="sm">{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* File Upload Zone */}
        <div
          className={`card ${dragOver ? 'hoverable' : ''}`}
          style={{ marginBottom: '20px', cursor: 'pointer', borderStyle: 'dashed', borderColor: dragOver ? 'var(--accent)' : 'var(--border)' }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <div className="card-body text-center" style={{ padding: '32px' }}>
            {file ? (
              <div className="flex-center gap-sm">
                <FileText size={20} style={{ color: 'var(--accent)' }} />
                <span>{file.name}</span>
              </div>
            ) : (
              <>
                <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <p className="text-secondary">Drag & drop a PDF or image, or click to browse</p>
              </>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />

        <div className="grid grid-2" style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">Report Title *</label>
            <input className="form-input" placeholder="e.g. Blood Work - June 2024" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Report Date *</label>
            <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>

        {/* Biomarker Categories */}
        <h4 style={{ marginBottom: '12px' }}>Biomarker Values</h4>
        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
          Expand categories and enter the values from the lab report
        </p>

        {Object.entries(BIOMARKER_CATEGORIES).map(([category, tests]) => (
          <div key={category} className="card" style={{ marginBottom: '8px', background: 'var(--bg-secondary)' }}>
            <button
              type="button" className="card-header" style={{ width: '100%', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
              onClick={() => setExpandedCat(expandedCat === category ? null : category)}
            >
              <h4 style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{category}</h4>
              {expandedCat === category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedCat === category && (
              <div className="card-body" style={{ paddingTop: '0' }}>
                {tests.map(test => {
                  const active = biomarkers.find(b => b.name === test.name);
                  return (
                    <div key={test.name} className="flex" style={{ alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <input
                        type="checkbox" checked={!!active}
                        onChange={() => toggleBiomarker(test.name, test.unit, category)}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span style={{ flex: 1, fontSize: '0.85rem' }}>{test.name}</span>
                      {active && (
                        <input
                          className="form-input" type="number" step="0.01" placeholder="Value"
                          value={active.value} onChange={(e) => updateBiomarkerValue(test.name, e.target.value)}
                          style={{ width: '100px', padding: '6px 10px' }}
                        />
                      )}
                      <span className="text-muted" style={{ fontSize: '0.75rem', minWidth: '60px' }}>{test.unit}</span>
                      <span className="text-muted" style={{ fontSize: '0.7rem', minWidth: '80px' }}>
                        {test.range?.min}–{test.range?.max}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: '20px' }}>
          <Button type="submit" variant="primary" loading={uploading} icon={<Send size={18} />} fullWidth>
            Upload & Evaluate
          </Button>
        </div>
      </form>
    </div>
  );
}
