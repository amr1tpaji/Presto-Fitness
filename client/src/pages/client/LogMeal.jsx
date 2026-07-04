import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../../context/ToastContext';
import { mealChatAPI } from '../../services/api';
import { Camera, Trash2, UtensilsCrossed, Send, Sparkles } from 'lucide-react';
import Loader from '../../components/common/Loader';
import '../../styles/client.css';

export default function LogMeal() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [text, setText] = useState('');
  
  // Start with a greeting
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: 'Hi! Ready to log a meal? Snap a photo or tell me what you ate, and I will help you track it accurately! 🍎' }
  ]);

  // Keep track of the raw history to send to backend API
  const [apiHistory, setApiHistory] = useState([]);
  
  // Track if a photo was uploaded in this session (so we can pass its url in subsequent messages if needed)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);
  const [mealLogged, setMealLogged] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, photoPreview]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image must be less than 5MB', 'warning');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !photoFile) return;

    const userMessage = text;
    const currentPhotoPreview = photoPreview;
    
    // Add to UI history immediately
    setChatHistory(prev => [
      ...prev, 
      { role: 'user', text: userMessage, photo: currentPhotoPreview }
    ]);
    
    // Build API payload
    const formData = new FormData();
    if (userMessage) formData.append('message', userMessage);
    if (photoFile) formData.append('photo', photoFile);
    if (uploadedPhotoUrl) formData.append('existingPhoto', uploadedPhotoUrl);
    formData.append('history', JSON.stringify(apiHistory));

    setText('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setLoading(true);

    try {
      const res = await mealChatAPI.sendMessage(formData);
      const data = res.data?.data;

      if (data.isFunctionCall) {
        // AI logged the meal!
        setChatHistory(prev => [
          ...prev,
          { role: 'model', text: data.text + ' You can view it in your Admin Dashboard or Home feed.' }
        ]);
        setMealLogged(true);
        addToast('Meal successfully logged and macros calculated!', 'success');
        
        // Wait a few seconds, then redirect to home
        setTimeout(() => {
          navigate('/home');
        }, 3000);
      } else {
        // AI asks a question
        setChatHistory(prev => [
          ...prev,
          { role: 'model', text: data.text }
        ]);
        
        // Update API history so it remembers context
        const newApiHistory = [...apiHistory];
        if (userMessage || photoFile) {
           newApiHistory.push({ role: 'user', text: userMessage || 'Attached a photo of my food.' });
        }
        newApiHistory.push({ role: 'model', text: data.text });
        setApiHistory(newApiHistory);

        // Keep track of the uploaded photo URL so we can attach it to the final DB entry
        if (data.photoPath) {
          setUploadedPhotoUrl(data.photoPath);
        }
      }

    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to chat with AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title flex gap-sm" style={{ alignItems: 'center' }}>
            <Sparkles size={28} className="text-accent" /> AI Meal Logger
          </h1>
          <p className="page-subtitle">Chat with Gemini AI to accurately log your food and macros.</p>
        </div>
      </div>

      <div className="card" style={{ flex: 1, maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Chat History View */}
        <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {chatHistory.map((msg, idx) => {
            const isModel = msg.role === 'model';
            return (
              <div key={idx} style={{
                alignSelf: isModel ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                display: 'flex',
                gap: '0.5rem',
                flexDirection: isModel ? 'row' : 'row-reverse'
              }}>
                {isModel && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={16} color="var(--bg-primary)" />
                  </div>
                )}
                
                <div style={{
                  background: isModel ? 'var(--bg-tertiary, #222)' : 'var(--accent)',
                  color: isModel ? '#fff' : 'var(--bg-primary, #000)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  borderTopLeftRadius: isModel ? 0 : 'var(--radius-lg)',
                  borderTopRightRadius: !isModel ? 0 : 'var(--radius-lg)',
                }}>
                  {msg.photo && (
                    <div style={{ marginBottom: '0.5rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <img src={msg.photo} alt="Upload preview" style={{ maxWidth: 150, maxHeight: 150, objectFit: 'cover' }} />
                    </div>
                  )}
                  <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                </div>
              </div>
            );
          })}
          
          {loading && (
             <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem' }}>
               <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={16} color="var(--bg-primary)" />
                </div>
                <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-lg)', borderTopLeftRadius: 0 }}>
                  <Loader size={16} />
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input View */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          {photoPreview && (
            <div style={{ position: 'relative', width: 80, height: 80, marginBottom: '0.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', padding: 4, borderRadius: '50%', cursor: 'pointer' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              className="btn"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
              disabled={loading || mealLogged}
            >
              <Camera size={20} />
            </button>
            <input
              type="text"
              className="form-input"
              placeholder={photoFile ? "Add a comment..." : "Type what you ate or snap a photo..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 1, margin: 0 }}
              disabled={loading || mealLogged}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || mealLogged || (!text.trim() && !photoFile)}
              style={{ padding: '0.75rem' }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
