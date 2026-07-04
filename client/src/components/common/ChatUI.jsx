import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { messagesAPI, getImageUrl } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Send, User, CheckCheck } from 'lucide-react';
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
      await fetchMessages();
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
    <div className="card flex-col" style={{ height: '500px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {otherUser.avatar ? (
            <img src={getImageUrl(otherUser.avatar)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={20} color="var(--bg-primary)" />
          )}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{otherUser.name}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{otherUser.role}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '1.5rem 1rem' }}>
        {loading ? (
          <Loader />
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
              This is the beginning of your conversation with {otherUser.name}.
            </div>
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
                padding: '8px 10px 10px 12px',
                borderRadius: '12px',
                borderTopRightRadius: isMe ? 0 : '12px',
                borderTopLeftRadius: !isMe ? 0 : '12px',
                wordBreak: 'break-word',
                boxShadow: 'var(--shadow)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {isMe ? (
                  <div style={{ position: 'absolute', top: 0, right: '-8px', width: 0, height: 0, borderTop: `12px solid var(--accent)`, borderRight: '10px solid transparent' }} />
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: '-8px', width: 0, height: 0, borderTop: `12px solid var(--bg-tertiary, #222)`, borderLeft: '10px solid transparent' }} />
                )}
                
                <div style={{ fontSize: '0.95rem', paddingRight: '45px' }}>
                  {msg.text}
                </div>

                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px',
                  position: 'absolute', bottom: '6px', right: '10px'
                }}>
                  <span style={{ fontSize: '0.65rem', color: isMe ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && <CheckCheck size={14} style={{ color: 'rgba(0,0,0,0.7)' }} />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ 
              flex: 1, background: 'var(--bg-tertiary, #222)', border: '1px solid var(--border)', color: '#fff', 
              padding: '12px 16px', borderRadius: '24px', fontSize: '0.95rem', outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <button type="submit" disabled={sending || !text.trim()} style={{ 
            background: 'var(--accent)', border: 'none', width: 44, height: 44, borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary, #000)', 
            cursor: (!text.trim() || sending) ? 'not-allowed' : 'pointer',
            opacity: (!text.trim() || sending) ? 0.5 : 1,
            transition: 'opacity 0.2s'
          }}>
            <Send size={18} style={{ marginLeft: -2 }} />
          </button>
        </form>
      </div>
    </div>
  );
}
