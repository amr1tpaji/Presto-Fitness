import { useState, useEffect, useContext, useCallback } from 'react';
import { paymentsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import { CreditCard, Calendar, User } from 'lucide-react';

export default function Payments() {
  const { addToast } = useContext(ToastContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await paymentsAPI.getAllAdmin({ limit: 50 });
      setPayments(res.data?.data?.payments || []);
    } catch (err) {
      addToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
        <p className="page-subtitle">View and manage all client transactions</p>
      </div>

      {loading ? (
        <Loader />
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <CreditCard size={48} />
          <h3>No payments found</h3>
          <p className="text-muted">No transactions have been recorded yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const pId = payment._id || payment.id;
                  return (
                    <tr key={pId}>
                      <td>
                        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                          <Calendar size={14} className="text-muted" />
                          <span>
                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                          <User size={14} className="text-muted" />
                          <span style={{ fontWeight: 600 }}>
                            {payment.userId?.name || 'Unknown Client'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {payment.userId?.phone || ''}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        ₹{payment.amount?.toLocaleString('en-IN')}
                      </td>
                      <td>{payment.plan || '-'}</td>
                      <td>
                        <Badge variant={payment.status === 'paid' || payment.status === 'completed' ? 'success' : 'warning'}>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
