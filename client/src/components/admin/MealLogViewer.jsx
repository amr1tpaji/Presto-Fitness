import { useState, useEffect, useContext, useCallback } from 'react';
import { mealsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Loader from '../common/Loader';
import { UtensilsCrossed, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '../common/Badge';

export default function MealLogViewer({ clientId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useContext(ToastContext);
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchMeals = useCallback(async () => {
    try {
      const res = await mealsAPI.getClientMeals(clientId);
      setLogs(res.data?.data?.mealLogs || []);
    } catch (err) {
      addToast('Failed to load meal logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [clientId, addToast]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  if (loading) return <Loader />;

  if (logs.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="empty-state">
            <UtensilsCrossed size={48} />
            <p>No meals logged yet by this client.</p>
          </div>
        </div>
      </div>
    );
  }

  const toggleExpand = (id) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  return (
    <div className="flex-col gap-md">
      {logs.map((log, idx) => {
        const isExpanded = expandedLog === (log._id || idx);
        
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFats = 0;

        log.items.forEach(item => {
          totalCalories += item.calories || 0;
          totalProtein += item.protein || 0;
          totalCarbs += item.carbs || 0;
          totalFats += item.fats || 0;
        });

        return (
          <div key={log._id || idx} className="card" style={{ transition: 'all 0.2s ease' }}>
            <div 
              className="card-header flex flex-between" 
              style={{ cursor: 'pointer', alignItems: 'center' }}
              onClick={() => toggleExpand(log._id || idx)}
            >
              <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)', 
                  background: 'var(--accent-subtle)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <UtensilsCrossed size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{log.mealType}</h3>
                  <div className="text-muted flex gap-sm" style={{ fontSize: '0.85rem', alignItems: 'center', marginTop: 4 }}>
                    <Calendar size={14} /> 
                    {new Date(log.date || log.createdAt).toLocaleDateString('en-IN', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-lg" style={{ alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalCalories} kcal</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    P: {totalProtein}g | C: {totalCarbs}g | F: {totalFats}g
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
              </div>
            </div>

            {isExpanded && (
              <div className="card-body" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-tertiary, #1a1a1a)' }}>
                <div className="grid grid-2 gap-lg" style={{ alignItems: 'start' }}>
                  
                  {/* Items List */}
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>Food Items</h4>
                    <div className="flex-col gap-sm">
                      {log.items.map((item, i) => (
                        <div key={i} className="flex flex-between" style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.food}</div>
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>{item.quantity} {item.unit}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.calories} kcal</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                              P:{item.protein} C:{item.carbs} F:{item.fats}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar (Photo & Comments) */}
                  <div className="flex-col gap-md">
                    {log.photo ? (
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Attached Photo</h4>
                        <img 
                          src={`/uploads/${log.photo}`} 
                          alt="Meal" 
                          style={{ width: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No photo attached
                      </div>
                    )}
                    
                    {log.comment && (
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Client Note</h4>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                          "{log.comment}"
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
