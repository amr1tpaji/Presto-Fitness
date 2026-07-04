import { useState, useContext, useMemo } from 'react';
import { dietsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Button from '../common/Button';
import { Plus, Trash2, Save, UtensilsCrossed } from 'lucide-react';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];
const emptyItem = { food: '', quantity: '', unit: 'g', calories: 0, protein: 0, carbs: 0, fats: 0 };

export default function DietPlanBuilder({ dietPlan = null, clientId, onSave }) {
  const [title, setTitle] = useState(dietPlan?.title || '');
  const [description, setDescription] = useState(dietPlan?.description || '');
  const [notes, setNotes] = useState(dietPlan?.notes || '');
  const [activeMeal, setActiveMeal] = useState('Breakfast');
  const [meals, setMeals] = useState(
    dietPlan?.meals?.length ? dietPlan.meals :
    MEAL_TYPES.slice(0, 4).map(name => ({ name, items: [{ ...emptyItem }], time: '' }))
  );
  const [saving, setSaving] = useState(false);
  const { addToast } = useContext(ToastContext);

  const currentMeal = meals.find(m => m.name === activeMeal);
  const currentMealIndex = meals.findIndex(m => m.name === activeMeal);

  const totals = useMemo(() => {
    return meals.reduce((acc, meal) => {
      meal.items.forEach(item => {
        acc.calories += Number(item.calories) || 0;
        acc.protein += Number(item.protein) || 0;
        acc.carbs += Number(item.carbs) || 0;
        acc.fats += Number(item.fats) || 0;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [meals]);

  const addItem = () => {
    const updated = [...meals];
    updated[currentMealIndex].items.push({ ...emptyItem });
    setMeals(updated);
  };

  const removeItem = (itemIndex) => {
    const updated = [...meals];
    if (updated[currentMealIndex].items.length <= 1) return;
    updated[currentMealIndex].items = updated[currentMealIndex].items.filter((_, i) => i !== itemIndex);
    setMeals(updated);
  };

  const updateItem = (itemIndex, field, value) => {
    const updated = [...meals];
    updated[currentMealIndex].items[itemIndex] = {
      ...updated[currentMealIndex].items[itemIndex],
      [field]: value,
    };
    setMeals(updated);
  };

  const updateMealTime = (time) => {
    const updated = [...meals];
    updated[currentMealIndex].time = time;
    setMeals(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { addToast('Please enter a title', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        title, description, notes, meals,
        totalCalories: totals.calories, totalProtein: totals.protein,
        totalCarbs: totals.carbs, totalFats: totals.fats,
        ...(clientId && { assignedTo: [clientId] }),
      };
      if (dietPlan?._id) {
        await dietsAPI.update(dietPlan._id, payload);
        addToast('Diet plan updated!', 'success');
      } else {
        await dietsAPI.create(payload);
        addToast('Diet plan created!', 'success');
      }
      onSave?.();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-2" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">Plan Title *</label>
          <input className="form-input" placeholder="e.g. Cutting Diet" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="Brief description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Macro Summary */}
      <div className="card" style={{ background: 'var(--bg-secondary)', marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div className="grid grid-4" style={{ textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{totals.calories}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>CALORIES</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#60a5fa' }}>{totals.protein}g</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>PROTEIN</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{totals.carbs}g</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>CARBS</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171' }}>{totals.fats}g</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>FATS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Type Tabs */}
      <div className="tabs">
        {meals.map(meal => (
          <button key={meal.name} type="button" className={`tab ${activeMeal === meal.name ? 'active' : ''}`} onClick={() => setActiveMeal(meal.name)}>
            {meal.name}
          </button>
        ))}
      </div>

      {/* Current Meal Items */}
      {currentMeal && (
        <>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Meal Time</label>
            <input className="form-input" type="time" value={currentMeal.time} onChange={(e) => updateMealTime(e.target.value)} style={{ width: '180px' }} />
          </div>

          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <h4 className="flex" style={{ alignItems: 'center', gap: '8px' }}>
              <UtensilsCrossed size={16} style={{ color: 'var(--accent)' }} /> Food Items
            </h4>
            <Button type="button" variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addItem}>Add Item</Button>
          </div>

          {currentMeal.items.map((item, i) => (
            <div key={i} className="card" style={{ background: 'var(--bg-secondary)', marginBottom: '12px' }}>
              <div className="card-body" style={{ padding: '12px' }}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>ITEM {i + 1}</span>
                  {currentMeal.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-3" style={{ gap: '8px', marginBottom: '8px' }}>
                  <input className="form-input" placeholder="Food name" value={item.food} onChange={(e) => updateItem(i, 'food', e.target.value)} />
                  <input className="form-input" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                  <select className="form-select" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)}>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="cups">cups</option>
                    <option value="pcs">pcs</option>
                    <option value="tbsp">tbsp</option>
                    <option value="scoop">scoop</option>
                  </select>
                </div>
                <div className="grid grid-4" style={{ gap: '8px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Calories</label>
                    <input className="form-input" type="number" min="0" value={item.calories} onChange={(e) => updateItem(i, 'calories', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Protein (g)</label>
                    <input className="form-input" type="number" min="0" value={item.protein} onChange={(e) => updateItem(i, 'protein', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Carbs (g)</label>
                    <input className="form-input" type="number" min="0" value={item.carbs} onChange={(e) => updateItem(i, 'carbs', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Fats (g)</label>
                    <input className="form-input" type="number" min="0" value={item.fats} onChange={(e) => updateItem(i, 'fats', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <Button type="submit" variant="primary" loading={saving} icon={<Save size={18} />} fullWidth>
        {dietPlan?._id ? 'Update Diet Plan' : 'Create Diet Plan'}
      </Button>
    </form>
  );
}
