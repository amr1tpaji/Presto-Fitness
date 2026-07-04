import { useState, useEffect, useContext } from 'react';
import { messagesAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import ChatUI from '../../components/common/ChatUI';
import Loader from '../../components/common/Loader';
import { MessageCircle } from 'lucide-react';

export default function Messages() {
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await messagesAPI.getTrainers();
        const t = res.data?.data?.trainers || [];
        setTrainers(t);
        if (t.length > 0) {
          setSelectedTrainer(t[0]); // auto-select the first trainer (usually only 1 admin anyway)
        }
      } catch (err) {
        addToast('Failed to load trainers', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, [addToast]);

  if (loading) return <div className="page"><Loader /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title flex gap-sm" style={{ alignItems: 'center' }}>
          <MessageCircle size={28} className="text-accent" /> Messages
        </h1>
        <p className="page-subtitle">Chat directly with your trainer</p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {trainers.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={48} />
            <p>No trainers available to chat with at the moment.</p>
          </div>
        ) : (
          <ChatUI otherUser={selectedTrainer} />
        )}
      </div>
    </div>
  );
}
