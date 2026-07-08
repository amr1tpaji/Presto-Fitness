import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatAPI, messagesAPI } from '../../services/api';
import { Sparkles, X, Send, User, Bot, Loader2, MessageCircle } from 'lucide-react';
import { ToastContext } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

export default function Chatbot({ isOpenExternal = null, setIsOpenExternal = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = isOpenExternal !== null ? isOpenExternal : localIsOpen;
  const setIsOpen = setIsOpenExternal !== null ? setIsOpenExternal : setLocalIsOpen;
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi there! I am Kitty, your cute fitness companion! 🎀 How can I help you today?', mood: 'happy' }
  ]);
  const [currentMood, setCurrentMood] = useState('happy');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user?._id) {
        try {
          const res = await chatAPI.getHistory();
          if (res.data?.data && res.data.data.length > 0) {
            setMessages(res.data.data);
          }
        } catch (err) {
          console.error('Failed to load chat history', err);
        }
      }
    };
    fetchHistory();
  }, [user?._id]);

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const res = await messagesAPI.getUnreadCount();
        setUnreadCount(res.data?.data?.unreadCount || 0);
      } catch (err) {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, []);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', text: input.trim() };
    const currentHistory = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage({
        message: userMessage.text
      });

      const reply = res.data.data.reply;
      const mood = res.data.data.mood || 'happy';
      const imageUrl = res.data.data.imageUrl;
      
      setCurrentMood(mood);
      setMessages(prev => [...prev, { role: 'model', text: reply, mood, imageUrl }]);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to connect to AI Coach', 'error');
      // Optionally remove the user message if it failed, but let's just show an error message in chat
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now. Please try again later!' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMealLogged = async (e) => {
      const items = e.detail?.items || [];
      if (!items.length) return;
      
      const mealDesc = items.map(i => `${i.quantity}${i.unit} ${i.food}`).join(', ');
      const text = `I just logged a meal: ${mealDesc}. Can you review it?`;
      const userMessage = { role: 'user', text };
      
      setIsOpen(true);
      const currentHistory = [...messages];
      setMessages(prev => [...prev, userMessage]);
      setLoading(true);

      try {
        const res = await chatAPI.sendMessage({
          message: text
        });

        const reply = res.data.data.reply;
        const mood = res.data.data.mood || 'happy';
        const imageUrl = res.data.data.imageUrl;
        setCurrentMood(mood);
        setMessages(prev => [...prev, { role: 'model', text: reply, mood, imageUrl }]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('MEAL_LOGGED', handleMealLogged);
    return () => window.removeEventListener('MEAL_LOGGED', handleMealLogged);
  }, [messages, setIsOpen]);

  return (
    <>
      {!isOpen && isOpenExternal === null && (
        <>
          <button
            className="chatbot-fab kitty-bounce"
            onClick={() => setIsOpen(true)}
            title="Ask Kitty"
            style={{ 
              background: 'var(--bg-secondary)', 
              padding: 0, 
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '2px solid var(--accent)'
            }}
          >
            <img src="/kitty_happy.png" alt="Kitty Companion" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
          
          {user?.role !== 'admin' && (
            <button
              className="chatbot-fab"
              onClick={() => {
                if (location.pathname === '/messages') {
                  navigate('/home');
                } else {
                  navigate('/messages');
                }
              }}
              title="Chat with Trainer"
              style={{
                bottom: '90px',
                background: 'var(--warning, #f59e0b)'
              }}
            >
              <MessageCircle size={24} />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: -2, right: -2, background: 'var(--danger, #ef4444)',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '50%',
                  width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
          )}
        </>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
              <div className="chatbot-avatar" style={{ background: 'transparent', padding: 0 }}>
                <img src={`/kitty_${currentMood}.png`} alt="Kitty" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Kitty 🎀</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your Cute Companion</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsOpen(false)} style={{ color: '#fff' }}>
              <X size={20} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message-wrapper ${msg.role}`}>
                <div className="chat-avatar" style={{ background: msg.role === 'model' ? 'transparent' : 'var(--bg-tertiary)' }}>
                  {msg.role === 'model' ? <img src={`/kitty_${msg.mood || 'happy'}.png`} alt="Kitty" style={{ width: 24, height: 24 }} /> : <User size={14} />}
                </div>
                <div className={`chat-message ${msg.role}`}>
                  {msg.text}
                  {msg.imageUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <img src={msg.imageUrl} alt="Kitty's Selfie" style={{ maxWidth: '100%', borderRadius: '8px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message-wrapper model">
                <div className="chat-avatar" style={{ background: 'transparent' }}><img src={`/kitty_thinking.png`} alt="Kitty Thinking" style={{ width: 24, height: 24 }} /></div>
                <div className="chat-message model" style={{ display: 'flex', alignItems: 'center' }}>
                  <Loader2 size={16} className="spin" style={{ marginRight: 8 }} /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask about workouts, diet, etc..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
