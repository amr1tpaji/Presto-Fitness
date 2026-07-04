import { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../../context/ToastContext';
import { mealsAPI } from '../../services/api';
import { ArrowLeft, Camera, Plus, Trash2, UtensilsCrossed, Save } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import '../../styles/client.css';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function LogMeal() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState('Lunch');
  const [items, setItems] = useState([
    { food: '', quantity: '', unit: 'g', calories: '', protein: '', carbs: '', fats: '' }
  ]);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [comment, setComment] = useState('');

  const handleAddItem = () => {
    setItems([...items, { food: '', quantity: '', unit: 'g', calories: '', protein: '', carbs: '', fats: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (['calories', 'protein', 'carbs', 'fats'].includes(field)) {
      newItems[index][field] = value === '' ? '' : Number(value);
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

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

  const calculateTotals = () => {
    return items.reduce((acc, item) => {
      acc.calories += Number(item.calories) || 0;
      acc.protein += Number(item.protein) || 0;
      acc.carbs += Number(item.carbs) || 0;
      acc.fats += Number(item.fats) || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validItems = items.filter(item => item.food.trim() !== '');
    if (validItems.length === 0) {
      addToast('Please add at least one food item', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('mealType', mealType);
      formData.append('items', JSON.stringify(validItems));
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

  const totals = calculateTotals();

  return (
    <div className="page">
      <div className="page-header">
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => navigate('/home')}
          style={{ marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
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
            <label className="form-label">Meal Type</label>
            <div className="tabs" style={{ marginBottom: 0 }}>
              {MEAL_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`tab ${mealType === type ? 'active' : ''}`}
                  onClick={() => setMealType(type)}
                  style={{ flex: 1 }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Food Items</label>
            <div className="flex-col gap-md">
              {items.map((item, index) => (
                <div key={index} style={{ background: 'var(--bg-tertiary, #1a1a1a)', padding: '1rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                  {items.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  
                  <div className="grid grid-2 gap-sm" style={{ marginBottom: '1rem', paddingRight: items.length > 1 ? '2rem' : '0' }}>
                    <input
                      className="form-input"
                      placeholder="Food name (e.g. Chicken Breast)"
                      value={item.food}
                      onChange={(e) => handleItemChange(index, 'food', e.target.value)}
                      required
                    />
                    <div className="flex gap-sm">
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        style={{ flex: 2 }}
                        required
                      />
                      <select 
                        className="form-select" 
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        style={{ flex: 1, padding: '0 8px' }}
                      >
                        <option value="g">g</option>
                        <option value="oz">oz</option>
                        <option value="cup">cup</option>
                        <option value="piece">piece</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-4 gap-sm">
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Calories"
                      value={item.calories}
                      onChange={(e) => handleItemChange(index, 'calories', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Protein (g)"
                      value={item.protein}
                      onChange={(e) => handleItemChange(index, 'protein', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Carbs (g)"
                      value={item.carbs}
                      onChange={(e) => handleItemChange(index, 'carbs', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Fats (g)"
                      value={item.fats}
                      onChange={(e) => handleItemChange(index, 'fats', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <Button type="button" variant="ghost" onClick={handleAddItem} icon={<Plus size={16} />}>
                Add Another Item
              </Button>
            </div>
          </div>

          <div style={{ background: 'var(--accent-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-glow)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--accent)' }}>Total Macros</h3>
            <div className="grid grid-4 gap-sm" style={{ textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totals.calories}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Calories</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totals.protein}g</div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Protein</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totals.carbs}g</div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Carbs</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totals.fats}g</div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Fats</div>
              </div>
            </div>
          </div>

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
