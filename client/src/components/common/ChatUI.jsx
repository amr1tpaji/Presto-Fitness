import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { messagesAPI, getImageUrl } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Send, User, CheckCheck, Smile, Paperclip, Mic } from 'lucide-react';
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

  // Define WhatsApp colors
  const theme = {
    bgApp: '#0b141a',
    bgHeader: '#202c33',
    bgInput: '#202c33',
    inputField: '#2a3942',
    sentMsg: '#005c4b',
    recvMsg: '#202c33',
    textMain: '#e9edef',
    textMuted: '#8696a0',
    blueTick: '#53bdeb',
    primary: '#00a884',
  };

  return (
    <div style={{ height: '500px', display: 'flex', flexDirection: 'column', background: theme.bgApp, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: theme.bgHeader, padding: '10px 16px' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {otherUser.avatar ? (
            <img src={getImageUrl(otherUser.avatar)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={20} color="var(--bg-primary)" />
          )}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: theme.textMain }}>{otherUser.name}</h3>
          <span style={{ fontSize: '0.75rem', color: theme.textMuted, textTransform: 'capitalize' }}>{otherUser.role}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
        {loading ? (
          <Loader />
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted }}>
            <div style={{ background: theme.bgHeader, padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
              Messages are end-to-end encrypted. No one outside of this chat can read them.
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?._id !== otherUser._id;
            return (
              <div key={msg._id || idx} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: isMe ? theme.sentMsg : theme.recvMsg,
                color: theme.textMain,
                padding: '6px 7px 8px 9px',
                borderRadius: '8px',
                borderTopRightRadius: isMe ? 0 : '8px',
                borderTopLeftRadius: !isMe ? 0 : '8px',
                wordBreak: 'break-word',
                boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {isMe ? (
                  <div style={{ position: 'absolute', top: 0, right: '-8px', width: 0, height: 0, borderTop: `10px solid ${theme.sentMsg}`, borderRight: '10px solid transparent' }} />
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: '-8px', width: 0, height: 0, borderTop: `10px solid ${theme.recvMsg}`, borderLeft: '10px solid transparent' }} />
                )}
                
                {/* We use a hacky margin-bottom to make space for the timestamp to wrap around naturally */}
                <div style={{ fontSize: '0.95rem', paddingRight: '50px' }}>
                  {msg.text}
                </div>

                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px',
                  position: 'absolute', bottom: '4px', right: '7px'
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && <CheckCheck size={14} style={{ color: theme.blueTick }} />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div style={{ padding: '10px 16px', background: theme.bgInput, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button type="button" style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}>
          <Smile size={24} />
        </button>
        <button type="button" style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}>
          <Paperclip size={24} />
        </button>
        
        <form onSubmit={handleSend} style={{ display: 'flex', flex: 1, gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ 
              flex: 1, background: theme.inputField, border: 'none', color: '#d1d7db', 
              padding: '9px 12px 11px', borderRadius: '8px', fontSize: '0.95rem', outline: 'none'
            }}
          />
          {text.trim() ? (
            <button type="submit" disabled={sending} style={{ 
              background: theme.primary, border: 'none', width: 40, height: 40, borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer'
            }}>
              <Send size={18} style={{ marginLeft: -2 }} />
            </button>
          ) : (
            <button type="button" style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}>
              <Mic size={24} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
