import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getImageUrl, dietsAPI } from '../../services/api';
import { FileText, Utensils, Clock, Flame, Info } from 'lucide-react';
import '../../styles/client.css';

export default function MyPlan() {
  const { user } = useAuth();
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDietPlan = async () => {
      try {
        const res = await dietsAPI.getForClient(user._id);
        if (res.data.data.dietPlans && res.data.data.dietPlans.length > 0) {
          setDietPlan(res.data.data.dietPlans[0]);
        }
      } catch (err) {
        console.error('Failed to fetch diet plan:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?._id) {
      fetchDietPlan();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="page flex flex-center" style={{ height: '100%' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page plan-page" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div className="page-header" style={{ flexShrink: 0, marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(45deg, var(--accent), #00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <FileText size={28} color="var(--accent)" /> My Intelligent Plan
        </h1>
        <p className="page-subtitle text-muted">Your customized, AI-extracted diet blueprint</p>
      </div>

      <div className="plan-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '2rem' }}>
        
        {/* Diet Plan Section (from DB) */}
        {dietPlan && (
          <div className="diet-plan-container" style={{ animation: 'slideUp 0.5s ease-out' }}>
            <div className="card glass-card" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              
              <div className="diet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(0,212,170,0.1)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Utensils size={20} color="var(--accent)" /> 
                    </div>
                    {dietPlan.title}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 0 42px' }}>Expertly crafted for your goals based on your coach's plan.</p>
                </div>
                
                <div className="macros-summary glass-badge" style={{ display: 'flex', gap: '16px', background: 'rgba(0, 212, 170, 0.1)', padding: '12px 20px', borderRadius: '100px', border: '1px solid rgba(0,212,170,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flame size={16} color="var(--danger)" />
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{dietPlan.totalCalories}</span> 
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kcal</span>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#58a6ff' }}></div>
                    <span style={{ fontWeight: '600' }}>{dietPlan.totalProtein}g</span> <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>P</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }}></div>
                    <span style={{ fontWeight: '600' }}>{dietPlan.totalFats}g</span> <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>F</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></div>
                    <span style={{ fontWeight: '600' }}>{dietPlan.totalCarbs}g</span> <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>C</span>
                  </div>
                </div>
              </div>

              <div className="meals-grid" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                {dietPlan.meals.map((meal, index) => (
                  <div key={index} className="meal-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(0,212,170,0.3)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '4px', height: '18px', background: 'var(--accent)', borderRadius: '2px' }}></span>
                        {meal.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontWeight: '500' }}>
                        <Clock size={14} /> {meal.time}
                      </div>
                    </div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {meal.items.map((item, idx) => (
                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                          <div style={{ flex: 1, paddingRight: '12px' }}>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)', display: 'block' }}>{item.food}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.quantity} {item.unit || ''}</span>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--accent)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Flame size={12}/> {item.calories}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.protein}P • {item.fats}F • {item.carbs}C</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!dietPlan && (
          <div className="empty-state glass-card" style={{ marginTop: '2rem', padding: '60px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <FileText size={40} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>No plan assigned yet</h3>
            <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>Your trainer hasn't uploaded your intelligent plan yet. Please check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}
