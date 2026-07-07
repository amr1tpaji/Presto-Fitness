import { useState, useContext } from 'react';
import { mealsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { UtensilsCrossed, Plus, Trash2, Send } from 'lucide-react';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const emptyFoodItem = () => ({
  food: '',
  quantity: '',
  unit: 'g',
});

export default function MealLogger() {
  const { addToast } = useContext(ToastContext);
  const [mealType, setMealType] = useState('Breakfast');
  const [items, setItems] = useState([emptyFoodItem()]);
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => {
    setItems((prev) => [...prev, emptyFoodItem()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter((item) => item.food.trim());
    if (!photoFile) {
      addToast('A photo is mandatory to log a meal', 'error');
      return;
    }
    
    if (validItems.length === 0 && !comment.trim()) {
      addToast('Please add at least one food item or a comment', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('mealType', mealType);
      
      const itemsData = validItems.map((item) => ({
        food: item.food.trim(),
        quantity: item.quantity,
        unit: item.unit,
      }));
      formData.append('items', JSON.stringify(itemsData));
      
      if (comment.trim()) {
        formData.append('comment', comment.trim());
      }
      
      if (photoFile) {
        formData.append('file', photoFile); // "file" matches backend uploadSingle field
      }

      const response = await mealsAPI.log(formData);
      addToast('Meal logged successfully! 🎉', 'success');
      
      // Get the items that were actually saved (in case AI generated them)
      const savedItems = response.data?.data?.mealLog?.items || validItems;
      
      // Trigger Kitty feedback!
      window.dispatchEvent(new CustomEvent('MEAL_LOGGED', { detail: { items: savedItems } }));
      
      setItems([emptyFoodItem()]);
      setComment('');
      setPhotoFile(null);
      setPhotoPreview('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to log meal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UtensilsCrossed size={20} style={{ color: 'var(--accent)' }} />
          Log a Meal
        </h3>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="flex-col gap-md">
            <div className="form-group">
              <label className="form-label">Meal Type</label>
              <div className="tabs" style={{ margin: 0 }}>
                {MEAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`tab ${mealType === type ? 'active' : ''}`}
                    onClick={() => setMealType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Food Items
              </label>
              <div className="flex-col gap-sm">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-sm"
                    style={{ alignItems: 'center' }}
                  >
                    <div style={{ flex: 2 }}>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Food name"
                        value={item.food}
                        onChange={(e) => updateItem(idx, 'food', e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <select
                        className="form-select"
                        value={item.unit}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="cup">cup</option>
                        <option value="tbsp">tbsp</option>
                        <option value="piece">piece</option>
                        <option value="scoop">scoop</option>
                        <option value="bowl">bowl</option>
                        <option value="plate">plate</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                        color: items.length <= 1 ? 'var(--border, #555)' : 'var(--danger, #ef4444)',
                        padding: 4,
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  icon={<Plus size={14} />}
                >
                  Add Item
                </Button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Photo *</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="form-input"
                style={{ padding: '8px' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setPhotoFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setPhotoPreview(reader.result);
                    reader.readAsDataURL(file);
                  } else {
                    setPhotoFile(null);
                    setPhotoPreview('');
                  }
                }}
              />
              {photoPreview && (
                <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', height: 100, width: 100 }}>
                  <img src={photoPreview} alt="Meal preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea
                className="form-textarea"
                placeholder="How was the meal? Any notes..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={submitting}
              icon={<Send size={18} />}
            >
              Log Meal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
