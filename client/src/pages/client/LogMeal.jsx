import { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../../context/ToastContext';
import { mealsAPI } from '../../services/api';
import { Camera, Trash2, UtensilsCrossed, Save } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import '../../styles/client.css';

export default function LogMeal() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [comment, setComment] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image must be less than 5MB', 'warning');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!photo && !comment.trim()) {
      addToast('Please upload a photo or add a comment', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('comment', comment);
      
      if (photo) {
        formData.append('file', photo); // multer in backend expects 'file'
      }

      await mealsAPI.log(formData);
      
      addToast('Meal logged successfully! +10 Points 🔥', 'success');
      navigate('/home');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to log meal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title flex gap-sm" style={{ alignItems: 'center' }}>
            <UtensilsCrossed size={28} className="text-accent" /> Log Meal
          </h1>
          <p className="page-subtitle">Track your nutrition and hit your macros.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <form className="card-body flex-col gap-lg" onSubmit={handleSubmit}>
          


          <div className="form-group">
            <label className="form-label">Meal Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handlePhotoChange}
            />
            {photoPreview ? (
              <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <img src={photoPreview} alt="Meal preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', padding: 8, borderRadius: '50%', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', height: 120, border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)', transition: 'var(--transition)'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Camera size={32} style={{ marginBottom: 8 }} />
                <span>Click to snap a photo</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <Input
              label="How did you feel? (Optional)"
              placeholder="e.g. Felt great, lots of energy!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} icon={<Save size={20} />}>
            Log Meal
          </Button>
        </form>
      </div>
    </div>
  );
}
