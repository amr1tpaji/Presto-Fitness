import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { messagesAPI, getImageUrl } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Send, User } from 'lucide-react';
import Loader from './Loader';

export default function ChatUI({ otherUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToast } = useContext(ToastContext);

  const fetchMessages = useCallback(async (showLoader = false) => {
    if (!otherUser?._id) return;
    if (showLoader) setLoading(true);
    try {
      const res = await messagesAPI.getConversation(otherUser._id);
      setMessages(res.data?.data?.messages || []);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [otherUser]);

  useEffect(() => {
    fetchMessages(true);
    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      await messagesAPI.sendMessage({ receiverId: otherUser._id, text });
      setText('');
      await fetchMessages(); // immediately refresh
    } catch (error) {
      addToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (!otherUser) {
    return <div className="empty-state">Select someone to chat with.</div>;
  }

  return (
    <div className="card flex-col" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header flex gap-md" style={{ alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {otherUser.avatar ? (
            <img src={getImageUrl(otherUser.avatar)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={20} color="var(--bg-primary)" />
          )}
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{otherUser.name}</h3>
          <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{otherUser.role}</span>
        </div>
      </div>

      <div className="card-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
        {loading ? (
          <Loader />
        ) : messages.length === 0 ? (
          <div className="empty-state text-muted" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?._id !== otherUser._id;
            return (
              <div key={msg._id || idx} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: isMe ? 'var(--accent)' : 'var(--bg-tertiary, #222)',
                color: isMe ? 'var(--bg-primary, #000)' : '#fff',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                borderBottomRightRadius: isMe ? 0 : 'var(--radius-lg)',
                borderBottomLeftRadius: !isMe ? 0 : 'var(--radius-lg)',
                wordBreak: 'break-word'
              }}>
                <div>{msg.text}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
