import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { dietsAPI, mealsAPI, getImageUrl } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import DietView from '../../components/client/DietView';
import Loader from '../../components/common/Loader';
import { UtensilsCrossed, Sparkles } from 'lucide-react';
import '../../styles/client.css';

export default function MyDiet() {
  const { addToast } = useContext(ToastContext);
  const [dietPlan, setDietPlan] = useState(null);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDiet = useCallback(async () => {
    try {
      const [res, mealsRes] = await Promise.all([
        dietsAPI.getAll(),
        mealsAPI.getToday()
      ]);
      const plans = res.data?.dietPlans || res.data || [];
      setDietPlan(plans.length > 0 ? plans[0] : null);
      setLoggedMeals(mealsRes.data?.data?.mealLogs || []);
    } catch (err) {
      addToast('Failed to load diet plan', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDiet();
  }, [fetchDiet]);

  const macroTotals = useMemo(() => {
    if (!dietPlan?.meals || !Array.isArray(dietPlan.meals)) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }
    return dietPlan.meals.reduce(
      (acc, meal) => {
        const items = meal.items || [meal];
        items.forEach((item) => {
          acc.calories += Number(item.calories) || 0;
          acc.protein += Number(item.protein) || 0;
          acc.carbs += Number(item.carbs) || 0;
          acc.fats += Number(item.fats) || 0;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [dietPlan]);

  if (loading) return <div className="page"><Loader /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UtensilsCrossed size={28} /> My Diet Plan
        </h1>
        <p className="page-subtitle">Your personalized nutrition plan</p>
      </div>

      {dietPlan && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <div
              style={{
                textAlign: 'center',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--accent)',
                marginBottom: '0.25rem',
              }}
            >
              {macroTotals.calories}
              <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}> kcal</span>
            </div>
            <p className="text-muted" style={{ textAlign: 'center', margin: '0 0 1.25rem', fontSize: '0.85rem' }}>
              Daily Target
            </p>
            <div className="flex gap-md" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Protein', value: macroTotals.protein, color: '#3b82f6', unit: 'g' },
                { label: 'Carbs', value: macroTotals.carbs, color: '#f59e0b', unit: 'g' },
                { label: 'Fats', value: macroTotals.fats, color: '#ef4444', unit: 'g' },
              ].map((macro) => {
                const total = macroTotals.protein + macroTotals.carbs + macroTotals.fats;
                const pct = total > 0 ? Math.round((macro.value / total) * 100) : 0;
                return (
                  <div key={macro.label} style={{ flex: 1, minWidth: 100, maxWidth: 160 }}>
                    <div className="flex flex-between" style={{ marginBottom: 4, fontSize: '0.8rem' }}>
                      <span style={{ color: macro.color, fontWeight: 600 }}>{macro.label}</span>
                      <span className="text-muted">{macro.value}{macro.unit} ({pct}%)</span>
                    </div>
                    <div className="macro-bar" style={{ background: 'var(--bg-tertiary, #333)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: macro.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <DietView dietPlan={dietPlan} />

      {/* Today's Logged Meals Section */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} className="text-accent" /> Today's Logged Meals
        </h2>
        
        {loggedMeals.length === 0 ? (
          <div className="empty-state card">
            <UtensilsCrossed size={32} />
            <p>You haven't logged any meals today.</p>
          </div>
        ) : (
          <div className="flex-col gap-md">
            {loggedMeals.map((meal, idx) => (
              <div key={meal._id || idx} className="card">
                <div className="card-header flex flex-between" style={{ alignItems: 'center', padding: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{meal.mealType || 'Meal'}</h3>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {new Date(meal.date || meal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="card-body" style={{ padding: '16px' }}>
                  {meal.photo && (
                    <div style={{ marginBottom: '1rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: 180 }}>
                      <img src={getImageUrl(meal.photo)} alt="Meal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div className="flex-col gap-sm" style={{ marginBottom: '1.5rem' }}>
                    {(meal.items || []).map((item, i) => (
                      <div key={i} className="flex flex-between" style={{ fontSize: '0.9rem', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{item.food}</span>
                          <span className="text-muted" style={{ marginLeft: 8 }}>({item.quantity} {item.unit})</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.calories} kcal</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            P: {item.protein}g | C: {item.carbs}g | F: {item.fats}g
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {meal.aiRemarks && (
                    <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem', color: 'var(--accent)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={16} /> AI Remarks & Adjustments
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {meal.aiRemarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
