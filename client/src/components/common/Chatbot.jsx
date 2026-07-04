import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { Sparkles, X, Send, User, Bot, Loader2, MessageCircle } from 'lucide-react';
import { ToastContext } from '../../context/ToastContext';

export default function Chatbot() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi! I am the Presto AI Fitness Coach. How can I help you crush your goals today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToast } = useContext(ToastContext);

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
      // Exclude the very first greeting message or format everything properly.
      const historyToPass = currentHistory.filter((_, idx) => idx !== 0);
      
      const res = await chatAPI.sendMessage({
        message: userMessage.text,
        history: historyToPass
      });

      const reply = res.data.data.reply;
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to connect to AI Coach', 'error');
      // Optionally remove the user message if it failed, but let's just show an error message in chat
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now. Please try again later!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <>
          <button
            className="chatbot-fab"
            onClick={() => setIsOpen(true)}
            title="Ask AI Coach"
          >
            <Sparkles size={24} />
          </button>
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
          </button>
        </>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
              <div className="chatbot-avatar">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Presto AI</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fitness & Nutrition Coach</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsOpen(false)} style={{ color: '#fff' }}>
              <X size={20} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message-wrapper ${msg.role}`}>
                <div className="chat-avatar">
                  {msg.role === 'model' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className={`chat-message ${msg.role}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message-wrapper model">
                <div className="chat-avatar"><Bot size={14} /></div>
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
