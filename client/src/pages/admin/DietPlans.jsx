import { useState, useEffect, useContext, useCallback } from 'react';
import { dietsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import DietPlanBuilder from '../../components/admin/DietPlanBuilder';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { UtensilsCrossed, Plus, Search, Edit2, Trash2, Flame, Apple } from 'lucide-react';

export default function DietPlans() {
  const { addToast } = useContext(ToastContext);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await dietsAPI.getAll();
      setPlans(res.data?.data?.dietPlans || []);
    } catch (err) {
      addToast('Failed to load diet plans', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreate = () => {
    setEditingPlan(null);
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleDelete = async (planId) => {
    setDeleting(planId);
    try {
      await dietsAPI.delete(planId);
      addToast('Diet plan deleted', 'success');
      setPlans((prev) => prev.filter((p) => (p._id || p.id) !== planId));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete diet plan', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingPlan(null);
    fetchPlans();
    addToast(editingPlan ? 'Diet plan updated!' : 'Diet plan created!', 'success');
  };

  const filtered = plans.filter(
    (p) => p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const calcTotalCalories = (plan) => {
    if (!plan.meals || !Array.isArray(plan.meals)) return 0;
    return plan.meals.reduce((sum, meal) => {
      if (meal.items && Array.isArray(meal.items)) {
        return sum + meal.items.reduce((s, item) => s + (Number(item.calories) || 0), 0);
      }
      return sum + (Number(meal.calories) || 0);
    }, 0);
  };

  const countMeals = (plan) => {
    if (!plan.meals) return 0;
    return Array.isArray(plan.meals) ? plan.meals.length : 0;
  };

  return (
    <div className="page">
      <div className="page-header flex flex-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Diet Plans</h1>
          <p className="page-subtitle">Design nutrition plans for your clients</p>
        </div>
        <Button variant="primary" onClick={handleCreate} icon={<Plus size={18} />}>
          Create Diet Plan
        </Button>
      </div>

      <div style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
        <Input
          placeholder="Search diet plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <UtensilsCrossed size={48} />
          <h3>No diet plans found</h3>
          <p className="text-muted">
            {search ? 'Try a different search term' : 'Create your first diet plan'}
          </p>
          {!search && (
            <Button variant="primary" onClick={handleCreate} icon={<Plus size={18} />}>
              Create Diet Plan
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-3 gap-md">
          {filtered.map((plan) => {
            const pId = plan._id || plan.id;
            const totalCal = calcTotalCalories(plan);
            const mealCount = countMeals(plan);
            return (
              <div key={pId} className="card">
                <div className="card-body">
                  <div className="flex flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: 'rgba(34,197,94,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--success, #22c55e)',
                      }}
                    >
                      <Apple size={22} />
                    </div>
                  </div>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem' }}>{plan.title}</h3>
                  {plan.description && (
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                      {plan.description.length > 80 ? plan.description.slice(0, 80) + '…' : plan.description}
                    </p>
                  )}
                  <div className="flex gap-md" style={{ marginBottom: '1rem' }}>
                    <span className="text-accent" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <Flame size={14} /> {totalCal} kcal
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <UtensilsCrossed size={14} /> {mealCount} meal{mealCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="divider" />
                  <div className="flex gap-sm" style={{ marginTop: '0.75rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)} icon={<Edit2 size={14} />}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pId)}
                      loading={deleting === pId}
                      style={{ color: 'var(--danger, #ef4444)' }}
                      icon={<Trash2 size={14} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingPlan(null); }} title={editingPlan ? 'Edit Diet Plan' : 'Create Diet Plan'} large>
          <DietPlanBuilder dietPlan={editingPlan} onSave={handleSave} />
        </Modal>
      )}
    </div>
  );
}
