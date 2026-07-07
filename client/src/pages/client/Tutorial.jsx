import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, weightAPI, mealsAPI } from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { User, Scale, UtensilsCrossed, ArrowRight, Check } from 'lucide-react';
import '../../styles/client.css'; // basic styling

export default function Tutorial() {
  const { user, reloadUser } = useAuth();
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Profile
  const [profile, setProfile] = useState({
    gender: user?.gender || '',
    age: '',
    height: user?.height || '',
    goalWeight: user?.goalWeight || '',
  });

  // Step 2: Weight
  const [weight, setWeight] = useState('');

  // Step 3: Meal
  const [mealPhoto, setMealPhoto] = useState(null);
  const [mealPreview, setMealPreview] = useState('');

  const finishTutorial = async () => {
    try {
      setLoading(true);
      await authAPI.updateProfile({ hasCompletedTutorial: true });
      await reloadUser(); // update context user
      navigate('/home');
      addToast('Welcome to Presto Fitness! 🎉', 'success');
    } catch (err) {
      addToast('Failed to finish tutorial', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...profile };
      if (profile.age) {
        const dob = new Date();
        dob.setFullYear(dob.getFullYear() - parseInt(profile.age));
        data.dateOfBirth = dob.toISOString();
      }
      await authAPI.updateProfile(data);
      addToast('Profile updated!', 'success');
      setStep(2);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await weightAPI.log({ weight: parseFloat(weight) });
      addToast('Weight logged successfully!', 'success');
      setStep(3);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to log weight', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    if (!mealPhoto) {
      addToast('Photo is required to log a meal!', 'error');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('mealType', 'Snack');
      formData.append('file', mealPhoto);
      formData.append('comment', 'First meal from tutorial');
      formData.append('items', JSON.stringify([]));

      await mealsAPI.log(formData);
      addToast('Meal logged! The AI will estimate calories.', 'success');
      await finishTutorial();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to log meal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-primary)'
    }}>
      <div className="card" style={{ maxWidth: 600, width: '100%' }}>
        <div className="card-header" style={{ textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)' }}>Welcome to Presto Fitness!</h1>
          <p className="text-muted" style={{ margin: 0 }}>Let's get your profile set up so you can start crushing your goals.</p>
        </div>

        <div className="card-body">
          {/* Progress Indicators */}
          <div className="flex flex-between" style={{ marginBottom: '2rem', padding: '0 2rem' }}>
            <div style={{ color: step >= 1 ? 'var(--accent)' : 'var(--text-muted)' }}>1. Profile</div>
            <div style={{ color: step >= 2 ? 'var(--accent)' : 'var(--text-muted)' }}>2. Weight</div>
            <div style={{ color: step >= 3 ? 'var(--accent)' : 'var(--text-muted)' }}>3. First Meal</div>
          </div>

          {step === 1 && (
            <form onSubmit={handleProfileSubmit}>
              <div className="flex-col gap-md">
                <div className="grid grid-2 gap-md">
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Input
                    label="Age"
                    type="number"
                    min="10" max="120"
                    placeholder="e.g. 28"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    required
                  />
                  <Input
                    label="Height (cm)"
                    type="number"
                    min="50" max="250"
                    placeholder="e.g. 175"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                    required
                  />
                  <Input
                    label="Goal Weight (kg)"
                    type="number"
                    min="20" max="300"
                    placeholder="e.g. 65"
                    value={profile.goalWeight}
                    onChange={(e) => setProfile({ ...profile, goalWeight: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-between mt-md">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>Skip</Button>
                  <Button type="submit" variant="primary" loading={loading} icon={<ArrowRight size={18} />}>Next</Button>
                </div>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleWeightSubmit}>
              <div className="flex-col gap-md">
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Scale size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
                  <p>Log your current weight. Make sure to log it <strong>every day</strong> to keep your streak alive!</p>
                </div>
                <Input
                  label="Current Weight (kg)"
                  type="number"
                  step="0.1"
                  min="20" max="300"
                  placeholder="e.g. 70.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
                <div className="flex flex-between mt-md">
                  <Button type="button" variant="ghost" onClick={() => setStep(3)}>Skip</Button>
                  <Button type="submit" variant="primary" loading={loading} icon={<ArrowRight size={18} />}>Next</Button>
                </div>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleMealSubmit}>
              <div className="flex-col gap-md">
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <UtensilsCrossed size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
                  <p>Let's log your first meal! A photo is <strong>mandatory</strong>. Our AI will automatically estimate the calories for you.</p>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Meal Photo *</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="form-input"
                    style={{ padding: '8px' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setMealPhoto(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setMealPreview(reader.result);
                        reader.readAsDataURL(file);
                      } else {
                        setMealPhoto(null);
                        setMealPreview('');
                      }
                    }}
                    required
                  />
                  {mealPreview && (
                    <div style={{ marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', height: 200, width: '100%' }}>
                      <img src={mealPreview} alt="Meal preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div className="flex flex-between mt-md">
                  <Button type="button" variant="ghost" onClick={finishTutorial}>Skip Tutorial</Button>
                  <Button type="submit" variant="primary" loading={loading} icon={<Check size={18} />}>Finish Tutorial</Button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
