import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { dietsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import DietView from '../../components/client/DietView';
import Loader from '../../components/common/Loader';
import { UtensilsCrossed } from 'lucide-react';
import '../../styles/client.css';

export default function MyDiet() {
  const { addToast } = useContext(ToastContext);
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDiet = useCallback(async () => {
    try {
      const res = await dietsAPI.getAll();
      const plans = res.data?.dietPlans || res.data || [];
      setDietPlan(plans.length > 0 ? plans[0] : null);
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
    </div>
  );
}
