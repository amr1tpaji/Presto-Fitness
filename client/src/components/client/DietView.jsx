import { useMemo } from 'react';
import { UtensilsCrossed, Coffee, Sun as SunIcon, Moon, Cookie } from 'lucide-react';

const MEAL_TYPE_CONFIG = {
  Breakfast: { icon: <Coffee size={18} />, color: '#f59e0b', time: '8:00 AM' },
  Lunch: { icon: <SunIcon size={18} />, color: '#22c55e', time: '1:00 PM' },
  Dinner: { icon: <Moon size={18} />, color: '#3b82f6', time: '8:00 PM' },
  Snack: { icon: <Cookie size={18} />, color: '#a855f7', time: 'Anytime' },
};

export default function DietView({ dietPlan }) {
  if (!dietPlan) {
    return (
      <div className="empty-state" style={{ padding: '3rem 0' }}>
        <UtensilsCrossed size={56} style={{ color: 'var(--text-muted, #888)' }} />
        <h3 style={{ margin: '1rem 0 0.25rem' }}>No Diet Plan Assigned</h3>
        <p className="text-muted">Your trainer hasn't assigned a diet plan yet.</p>
      </div>
    );
  }

  const mealsByType = useMemo(() => {
    const grouped = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
    if (!dietPlan.meals || !Array.isArray(dietPlan.meals)) return grouped;

    dietPlan.meals.forEach((meal) => {
      const mType = meal.name || meal.type || meal.mealType || 'Snack';
      const matched = Object.keys(grouped).find(
        (k) => k.toLowerCase() === mType.toLowerCase()
      ) || 'Snack';
      const items = meal.items || [meal];
      grouped[matched].push(...items);
    });
    return grouped;
  }, [dietPlan]);

  const macroTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    Object.values(mealsByType).forEach((items) => {
      items.forEach((item) => {
        totals.calories += Number(item.calories) || 0;
        totals.protein += Number(item.protein) || 0;
        totals.carbs += Number(item.carbs) || 0;
        totals.fats += Number(item.fats) || 0;
      });
    });
    return totals;
  }, [mealsByType]);

  const macroTotal = macroTotals.protein + macroTotals.carbs + macroTotals.fats;

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 0.25rem' }}>{dietPlan.title}</h2>
          {dietPlan.description && (
            <p className="text-muted" style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>{dietPlan.description}</p>
          )}
          <div
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--accent)',
              marginBottom: '0.5rem',
            }}
          >
            {macroTotals.calories}
            <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}> kcal</span>
          </div>

          <div className="flex gap-md" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {[
              { label: 'Protein', value: macroTotals.protein, color: '#3b82f6' },
              { label: 'Carbs', value: macroTotals.carbs, color: '#f59e0b' },
              { label: 'Fats', value: macroTotals.fats, color: '#ef4444' },
            ].map((m) => {
              const pct = macroTotal > 0 ? Math.round((m.value / macroTotal) * 100) : 0;
              return (
                <div key={m.label} style={{ minWidth: 90 }}>
                  <div className="flex flex-between" style={{ fontSize: '0.75rem', marginBottom: 2 }}>
                    <span style={{ color: m.color, fontWeight: 600 }}>{m.label}</span>
                    <span className="text-muted">{m.value}g</span>
                  </div>
                  <div
                    className="macro-bar"
                    style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary, #333)', overflow: 'hidden' }}
                  >
                    <div
                      style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: 3, transition: 'width 0.5s ease' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-col gap-md">
        {Object.entries(mealsByType).map(([type, items]) => {
          if (items.length === 0) return null;
          const config = MEAL_TYPE_CONFIG[type] || MEAL_TYPE_CONFIG.Snack;
          const mealCals = items.reduce((s, i) => s + (Number(i.calories) || 0), 0);

          return (
            <div key={type} className="meal-card card">
              <div className="card-body">
                <div className="flex flex-between" style={{ alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${config.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: config.color,
                      }}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{type}</h3>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{config.time}</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>
                    {mealCals} kcal
                  </span>
                </div>

                <div className="flex-col gap-sm">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-between"
                      style={{
                        padding: '0.5rem 0',
                        borderBottom: idx < items.length - 1 ? '1px solid var(--border, #333)' : 'none',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                          {item.food || item.name || 'Food item'}
                        </span>
                        {(item.quantity || item.unit) && (
                          <span className="text-muted" style={{ marginLeft: 6, fontSize: '0.8rem' }}>
                            {item.quantity} {item.unit}
                          </span>
                        )}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#3b82f6' }}>P:{item.protein || 0}g</span>
                        {' · '}
                        <span style={{ color: '#f59e0b' }}>C:{item.carbs || 0}g</span>
                        {' · '}
                        <span style={{ color: '#ef4444' }}>F:{item.fats || 0}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dietPlan.notes && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-body">
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Notes: </strong>
              {dietPlan.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
